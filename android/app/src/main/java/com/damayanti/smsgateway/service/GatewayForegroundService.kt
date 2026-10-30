package com.damayanti.smsgateway.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.damayanti.smsgateway.DamayantiGatewayApp
import com.damayanti.smsgateway.R
import com.damayanti.smsgateway.data.local.GatewayPreferences
import com.damayanti.smsgateway.data.remote.GatewayApiClient
import com.damayanti.smsgateway.telephony.SimManagerHelper
import com.damayanti.smsgateway.telephony.SmsTransmitter
import com.damayanti.smsgateway.ui.MainActivity
import kotlinx.coroutines.*

class GatewayForegroundService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Default + Job())
    private lateinit var prefs: GatewayPreferences
    private lateinit var apiClient: GatewayApiClient
    private lateinit var simHelper: SimManagerHelper
    private lateinit var smsTransmitter: SmsTransmitter

    private var isLoopRunning = false

    companion object {
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "ACTION_START_GATEWAY"
        const val ACTION_STOP = "ACTION_STOP_GATEWAY"
        const val ACTION_TOGGLE_PAUSE = "ACTION_TOGGLE_PAUSE"

        fun startService(context: Context) {
            val intent = Intent(context, GatewayForegroundService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, GatewayForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }

        fun togglePause(context: Context) {
            val intent = Intent(context, GatewayForegroundService::class.java).apply {
                action = ACTION_TOGGLE_PAUSE
            }
            context.startService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        prefs = GatewayPreferences(this)
        apiClient = GatewayApiClient(prefs)
        simHelper = SimManagerHelper(this)
        smsTransmitter = SmsTransmitter(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopForeground(true)
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_TOGGLE_PAUSE -> {
                prefs.isPaused = !prefs.isPaused
                updateNotification()
            }
            else -> {
                startForeground(NOTIFICATION_ID, buildNotification())
                if (!isLoopRunning) {
                    startWorkerLoops()
                }
            }
        }
        return START_STICKY
    }

    private fun buildNotification(): Notification {
        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val openAppIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            pendingIntentFlags
        )

        val pauseIntent = PendingIntent.getService(
            this,
            1,
            Intent(this, GatewayForegroundService::class.java).apply { action = ACTION_TOGGLE_PAUSE },
            pendingIntentFlags
        )

        val statusText = if (prefs.isPaused) {
            "Gateway PAUSED by owner"
        } else {
            "Active • Listening for jobs • Sent Today: ${prefs.sentTodayCount}"
        }

        val pauseActionText = if (prefs.isPaused) "Resume" else "Pause"

        return NotificationCompat.Builder(this, DamayantiGatewayApp.CHANNEL_ID)
            .setContentTitle("Damayanti SMS Gateway")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .setContentIntent(openAppIntent)
            .addAction(android.R.drawable.ic_media_pause, pauseActionText, pauseIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification() {
        val notification = buildNotification()
        val manager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        manager.notify(NOTIFICATION_ID, notification)
    }

    private fun startWorkerLoops() {
        isLoopRunning = true

        // Heartbeat Loop (every 30 seconds)
        serviceScope.launch {
            while (isActive) {
                if (prefs.isRegistered) {
                    sendHeartbeatCycle()
                }
                delay(30_000)
            }
        }

        // Job Polling Loop (every 3 seconds when active)
        serviceScope.launch {
            while (isActive) {
                if (prefs.isRegistered && !prefs.isPaused) {
                    pollAndProcessJobsCycle()
                }
                delay(3_000)
            }
        }
    }

    private suspend fun sendHeartbeatCycle() {
        val batteryIntent = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val batteryPct = if (level >= 0 && scale > 0) (level * 100) / scale else null
        val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL

        val activeSims = simHelper.getActiveSimCards()
        val primarySim = activeSims.find { it.slotIndex == prefs.selectedSimSlot } ?: activeSims.firstOrNull()

        val result = apiClient.sendHeartbeat(
            battery = batteryPct,
            isCharging = isCharging,
            carrier = primarySim?.carrierName ?: "BSNL",
            slot = primarySim?.slotIndex ?: prefs.selectedSimSlot
        )

        result.onSuccess { resp ->
            if (resp.isDisabled && !prefs.isPaused) {
                prefs.isPaused = true
                updateNotification()
            }
        }
    }

    private suspend fun pollAndProcessJobsCycle() {
        val pollResult = apiClient.pollJobs()
        pollResult.onSuccess { jobs ->
            for (job in jobs) {
                processSingleJob(job)
            }
        }
    }

    private suspend fun processSingleJob(job: com.damayanti.smsgateway.data.model.SmsJobPayload) {
        // 1. Acknowledge SENDING
        apiClient.ackJob(job.id, "SENDING")

        // 2. Transmit via SIM
        val subId = simHelper.resolveTargetSubscriptionId(prefs.selectedSimSlot)
        val transResult = smsTransmitter.transmitSms(job.id, job.recipientNumber, job.messageBody, subId)

        // 3. Report Radio Result
        if (transResult.isSubmitted) {
            prefs.incrementSentToday()
            apiClient.ackJob(
                jobId = job.id,
                status = "SUBMITTED",
                rawResponse = transResult.statusDescription
            )
        } else {
            prefs.incrementFailedToday()
            apiClient.ackJob(
                jobId = job.id,
                status = "FAILED",
                failureReason = transResult.statusDescription,
                isUncertain = transResult.isUncertain
            )
        }

        updateNotification()
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        isLoopRunning = false
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

package com.damayanti.smsgateway.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.RadioGroup
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.damayanti.smsgateway.R
import com.damayanti.smsgateway.data.local.GatewayPreferences
import com.damayanti.smsgateway.data.remote.GatewayApiClient
import com.damayanti.smsgateway.service.GatewayForegroundService
import com.damayanti.smsgateway.telephony.SimManagerHelper
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var prefs: GatewayPreferences
    private lateinit var apiClient: GatewayApiClient
    private lateinit var simHelper: SimManagerHelper

    private lateinit var etServerUrl: EditText
    private lateinit var tvDeviceId: TextView
    private lateinit var tvPairingStatus: TextView
    private lateinit var btnPair: Button
    private lateinit var tvSimInfo: TextView
    private lateinit var rgSimSelection: RadioGroup
    private lateinit var btnToggleService: Button
    private lateinit var btnPauseResume: Button
    private lateinit var tvSentToday: TextView
    private lateinit var tvFailedToday: TextView
    private lateinit var tvDiagnosticsLog: TextView

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            val smsGranted = permissions[Manifest.permission.SEND_SMS] ?: false
            val phoneGranted = permissions[Manifest.permission.READ_PHONE_STATE] ?: false

            appendLog("Permissions callback: SEND_SMS=$smsGranted, READ_PHONE_STATE=$phoneGranted")
            refreshSimInfo()
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = GatewayPreferences(this)
        apiClient = GatewayApiClient(prefs)
        simHelper = SimManagerHelper(this)

        initViews()
        requestAppPermissions()
        refreshUi()
    }

    private fun initViews() {
        etServerUrl = findViewById(R.id.etServerUrl)
        tvDeviceId = findViewById(R.id.tvDeviceId)
        tvPairingStatus = findViewById(R.id.tvPairingStatus)
        btnPair = findViewById(R.id.btnPair)
        tvSimInfo = findViewById(R.id.tvSimInfo)
        rgSimSelection = findViewById(R.id.rgSimSelection)
        btnToggleService = findViewById(R.id.btnToggleService)
        btnPauseResume = findViewById(R.id.btnPauseResume)
        tvSentToday = findViewById(R.id.tvSentToday)
        tvFailedToday = findViewById(R.id.tvFailedToday)
        tvDiagnosticsLog = findViewById(R.id.tvDiagnosticsLog)

        etServerUrl.setText(prefs.serverUrl)
        tvDeviceId.text = "Hardware ID: ${prefs.deviceId}"

        btnPair.setOnClickListener {
            handlePairing()
        }

        btnToggleService.setOnClickListener {
            GatewayForegroundService.startService(this)
            appendLog("Gateway Foreground Service started.")
            refreshUi()
        }

        btnPauseResume.setOnClickListener {
            GatewayForegroundService.togglePause(this)
            refreshUi()
        }

        rgSimSelection.setOnCheckedChangeListener { _, checkedId ->
            prefs.selectedSimSlot = if (checkedId == R.id.rbSim2) 1 else 0
            appendLog("Transmitter SIM slot locked to Slot ${prefs.selectedSimSlot + 1}")
        }
    }

    private fun requestAppPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_PHONE_STATE
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            permissionLauncher.launch(needed.toTypedArray())
        }
    }

    private fun handlePairing() {
        val url = etServerUrl.text.toString().trim()
        if (url.isEmpty()) {
            Toast.makeText(this, "Please enter a valid server URL", Toast.LENGTH_SHORT).show()
            return
        }

        prefs.serverUrl = url
        appendLog("Initiating device pairing with server: $url...")

        val activeSims = simHelper.getActiveSimCards()
        val bsnlSim = activeSims.find { it.isBsnl } ?: activeSims.firstOrNull()

        lifecycleScope.launch {
            val result = apiClient.registerDevice(
                model = "${Build.MANUFACTURER} ${Build.MODEL}",
                androidVer = Build.VERSION.RELEASE,
                carrier = bsnlSim?.carrierName ?: "BSNL",
                slot = bsnlSim?.slotIndex ?: prefs.selectedSimSlot
            )

            result.onSuccess {
                appendLog("Device pairing successful! Token & HMAC secret stored securely.")
                Toast.makeText(this@MainActivity, "Device paired successfully!", Toast.LENGTH_SHORT).show()
                refreshUi()
            }.onFailure { err ->
                appendLog("Pairing failed: ${err.message}")
                Toast.makeText(this@MainActivity, "Pairing error: ${err.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun refreshSimInfo() {
        val sims = simHelper.getActiveSimCards()
        if (sims.isEmpty()) {
            tvSimInfo.text = "No active SIM detected or permissions missing."
        } else {
            val builder = StringBuilder()
            for (sim in sims) {
                val tag = if (sim.isBsnl) " [BSNL - ACTIVE]" else ""
                builder.append("Slot ${sim.slotIndex + 1}: ${sim.carrierName}$tag\n")
            }
            tvSimInfo.text = builder.toString().trim()
        }
    }

    private fun refreshUi() {
        tvDeviceId.text = "Hardware ID: ${prefs.deviceId}"
        tvSentToday.text = prefs.sentTodayCount.toString()
        tvFailedToday.text = prefs.failedTodayCount.toString()

        if (prefs.isRegistered) {
            tvPairingStatus.text = "Status: Paired & Authenticated"
            tvPairingStatus.setTextColor(ContextCompat.getColor(this, R.color.success_green))
        } else {
            tvPairingStatus.text = "Status: Unpaired (Click Pair to Connect)"
            tvPairingStatus.setTextColor(ContextCompat.getColor(this, R.color.warning_yellow))
        }

        btnPauseResume.text = if (prefs.isPaused) "Resume" else "Pause"
        refreshSimInfo()
    }

    private fun appendLog(msg: String) {
        val time = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val logEntry = "[$time] $msg\n"
        tvDiagnosticsLog.append(logEntry)
    }

    override fun onResume() {
        super.onResume()
        refreshUi()
    }
}

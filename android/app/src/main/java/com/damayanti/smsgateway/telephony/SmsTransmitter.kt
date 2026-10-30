package com.damayanti.smsgateway.telephony

import android.Manifest
import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

data class TransmissionResult(
    val isSubmitted: Boolean,
    val isUncertain: Boolean,
    val radioCode: Int,
    val statusDescription: String
)

class SmsTransmitter(private val context: Context) {

    fun hasSmsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun getSmsManager(subscriptionId: Int?): SmsManager {
        return if (subscriptionId != null && subscriptionId != -1) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java).createForSubscriptionId(subscriptionId)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
            }
        } else {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
        }
    }

    /**
     * Transmits an SMS message using the phone's physical SIM card and captures the radio intent callback.
     */
    suspend fun transmitSms(
        jobId: String,
        recipient: String,
        text: String,
        subscriptionId: Int?
    ): TransmissionResult {
        if (!hasSmsPermission()) {
            return TransmissionResult(
                isSubmitted = false,
                isUncertain = false,
                radioCode = -1,
                statusDescription = "PERMISSION_DENIED: SEND_SMS permission is not granted"
            )
        }

        val sentAction = "com.damayanti.smsgateway.SMS_SENT_$jobId"
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_ONE_SHOT
        }

        val sentIntent = PendingIntent.getBroadcast(
            context,
            jobId.hashCode(),
            Intent(sentAction),
            flags
        )

        // Wait up to 30 seconds for cellular tower ACK
        val result = withTimeoutOrNull(30_000) {
            suspendCancellableCoroutine<TransmissionResult> { cont ->
                val receiver = object : BroadcastReceiver() {
                    override fun onReceive(c: Context?, intent: Intent?) {
                        try {
                            context.unregisterReceiver(this)
                        } catch (_: Exception) {}

                        val resultCode = resultCode
                        val description = when (resultCode) {
                            Activity.RESULT_OK -> "RESULT_OK: Message submitted to cellular radio base station"
                            SmsManager.RESULT_ERROR_GENERIC_FAILURE -> "RESULT_ERROR_GENERIC_FAILURE: Carrier radio generic error"
                            SmsManager.RESULT_ERROR_NO_SERVICE -> "RESULT_ERROR_NO_SERVICE: No BSNL cellular coverage / Emergency calls only"
                            SmsManager.RESULT_ERROR_RADIO_OFF -> "RESULT_ERROR_RADIO_OFF: Airplane mode or radio inactive"
                            SmsManager.RESULT_ERROR_LIMIT_EXCEEDED -> "RESULT_ERROR_LIMIT_EXCEEDED: Android SMS rate limit exceeded"
                            else -> "RESULT_CODE_$resultCode: Carrier radio error"
                        }

                        val isSubmitted = (resultCode == Activity.RESULT_OK)
                        val isUncertain = (resultCode == SmsManager.RESULT_ERROR_GENERIC_FAILURE)

                        if (cont.isActive) {
                            cont.resume(
                                TransmissionResult(
                                    isSubmitted = isSubmitted,
                                    isUncertain = isUncertain,
                                    radioCode = resultCode,
                                    statusDescription = description
                                )
                            )
                        }
                    }
                }

                // On Android 13+ (Tiramisu, UpsideDownCake, VanillaIceCream), the PendingIntent broadcast
                // for carrier radio ACK originates from the system telephony process (com.android.phone).
                // It must be registered as RECEIVER_EXPORTED so Android OS does not drop the carrier callback.
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    context.registerReceiver(receiver, IntentFilter(sentAction), Context.RECEIVER_EXPORTED)
                } else {
                    context.registerReceiver(receiver, IntentFilter(sentAction))
                }

                cont.invokeOnCancellation {
                    try {
                        context.unregisterReceiver(receiver)
                    } catch (_: Exception) {}
                }

                try {
                    val smsManager = getSmsManager(subscriptionId)
                    val parts = smsManager.divideMessage(text)
                    if (parts.size > 1) {
                        // sendMultipartTextMessage requires sentIntents.size == parts.size
                        val sentIntents = ArrayList<PendingIntent>().apply {
                            repeat(parts.size) { add(sentIntent) }
                        }
                        smsManager.sendMultipartTextMessage(recipient, null, parts, sentIntents, null)
                    } else {
                        smsManager.sendTextMessage(recipient, null, text, sentIntent, null)
                    }
                } catch (e: Exception) {
                    try {
                        context.unregisterReceiver(receiver)
                    } catch (_: Exception) {}
                    if (cont.isActive) {
                        cont.resume(
                            TransmissionResult(
                                isSubmitted = false,
                                isUncertain = false,
                                radioCode = -2,
                                statusDescription = "SMS_SEND_EXCEPTION: ${e.message}"
                            )
                        )
                    }
                }
            }
        }

        return result ?: TransmissionResult(
            isSubmitted = false,
            isUncertain = true,
            radioCode = -99,
            statusDescription = "RADIO_TIMEOUT: 30s cellular ACK timeout. Holding to prevent duplicate OTP"
        )
    }
}

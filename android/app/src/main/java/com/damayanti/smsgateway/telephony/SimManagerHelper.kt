package com.damayanti.smsgateway.telephony

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import androidx.core.content.ContextCompat
import com.damayanti.smsgateway.data.model.SimCardInfo

class SimManagerHelper(private val context: Context) {

    fun hasPhoneStatePermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun getActiveSimCards(): List<SimCardInfo> {
        if (!hasPhoneStatePermission()) {
            return emptyList()
        }

        val subscriptionManager =
            context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
                ?: return emptyList()

        try {
            val list: List<SubscriptionInfo>? = subscriptionManager.activeSubscriptionInfoList
            if (list.isNullOrEmpty()) {
                return emptyList()
            }

            return list.map { info ->
                val carrier = info.carrierName?.toString() ?: "Unknown Carrier"
                val display = info.displayName?.toString() ?: "SIM ${info.simSlotIndex + 1}"
                val isBsnl = carrier.contains("BSNL", ignoreCase = true) ||
                             carrier.contains("CellOne", ignoreCase = true) ||
                             display.contains("BSNL", ignoreCase = true)

                SimCardInfo(
                    subscriptionId = info.subscriptionId,
                    slotIndex = info.simSlotIndex,
                    carrierName = carrier,
                    displayName = display,
                    isBsnl = isBsnl
                )
            }
        } catch (e: SecurityException) {
            return emptyList()
        }
    }

    /**
     * Resolves the target subscription ID for SMS transmission.
     * Prefers explicit user-configured slot or automatically detects active BSNL SIM.
     */
    fun resolveTargetSubscriptionId(preferredSlot: Int): Int? {
        val sims = getActiveSimCards()
        if (sims.isEmpty()) return null

        // 1. Check if preferred slot matches an active SIM
        val slotMatch = sims.find { it.slotIndex == preferredSlot }
        if (slotMatch != null) return slotMatch.subscriptionId

        // 2. Fallback to BSNL SIM if available
        val bsnlSim = sims.find { it.isBsnl }
        if (bsnlSim != null) return bsnlSim.subscriptionId

        // 3. Fallback to first available active SIM
        return sims.firstOrNull()?.subscriptionId
    }
}

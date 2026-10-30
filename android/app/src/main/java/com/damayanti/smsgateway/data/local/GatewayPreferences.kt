package com.damayanti.smsgateway.data.local

import android.content.Context
import android.content.SharedPreferences
import java.util.UUID

class GatewayPreferences(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("damayanti_gateway_secure_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_DEVICE_TOKEN = "device_token"
        private const val KEY_SIGNING_SECRET = "signing_secret"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_SELECTED_SIM_SLOT = "selected_sim_slot"
        private const val KEY_IS_PAUSED = "is_paused"
        private const val KEY_SENT_TODAY_COUNT = "sent_today_count"
        private const val KEY_FAILED_TODAY_COUNT = "failed_today_count"
        private const val DEFAULT_SERVER_URL = "http://192.168.1.150:4000" // Default local wifi IP
    }

    var deviceId: String
        get() {
            var id = prefs.getString(KEY_DEVICE_ID, null)
            if (id == null) {
                id = "galaxy_a35_" + UUID.randomUUID().toString().substring(0, 8)
                prefs.edit().putString(KEY_DEVICE_ID, id).apply()
            }
            return id
        }
        set(value) = prefs.edit().putString(KEY_DEVICE_ID, value).apply()

    var deviceToken: String?
        get() = prefs.getString(KEY_DEVICE_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_TOKEN, value).apply()

    var signingSecret: String?
        get() = prefs.getString(KEY_SIGNING_SECRET, null)
        set(value) = prefs.edit().putString(KEY_SIGNING_SECRET, value).apply()

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
        set(value) = prefs.edit().putString(KEY_SERVER_URL, value.trim().trimEnd('/')).apply()

    var selectedSimSlot: Int
        get() = prefs.getInt(KEY_SELECTED_SIM_SLOT, 0)
        set(value) = prefs.edit().putInt(KEY_SELECTED_SIM_SLOT, value).apply()

    var isPaused: Boolean
        get() = prefs.getBoolean(KEY_IS_PAUSED, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_PAUSED, value).apply()

    val isRegistered: Boolean
        get() = !deviceToken.isNullOrBlank() && !signingSecret.isNullOrBlank()

    var sentTodayCount: Int
        get() = prefs.getInt(KEY_SENT_TODAY_COUNT, 0)
        set(value) = prefs.edit().putInt(KEY_SENT_TODAY_COUNT, value).apply()

    var failedTodayCount: Int
        get() = prefs.getInt(KEY_FAILED_TODAY_COUNT, 0)
        set(value) = prefs.edit().putInt(KEY_FAILED_TODAY_COUNT, value).apply()

    fun incrementSentToday() {
        sentTodayCount += 1
    }

    fun incrementFailedToday() {
        failedTodayCount += 1
    }

    fun clearCredentials() {
        prefs.edit()
            .remove(KEY_DEVICE_TOKEN)
            .remove(KEY_SIGNING_SECRET)
            .apply()
    }
}

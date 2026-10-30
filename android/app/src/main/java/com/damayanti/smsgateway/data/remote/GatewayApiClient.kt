package com.damayanti.smsgateway.data.remote

import com.damayanti.smsgateway.data.local.GatewayPreferences
import com.damayanti.smsgateway.data.model.*
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class GatewayApiClient(private val prefs: GatewayPreferences) {

    private val gson = Gson()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()

    private fun calculateHmac(payload: String, secret: String): String {
        val hmacSha256 = Mac.getInstance("HmacSHA256")
        val secretKey = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256")
        hmacSha256.init(secretKey)
        val hash = hmacSha256.doFinal(payload.toByteArray(Charsets.UTF_8))
        return hash.joinToString("") { "%02x".format(it) }
    }

    suspend fun registerDevice(model: String, androidVer: String, carrier: String?, slot: Int): Result<RegisterDeviceResponse> =
        withContext(Dispatchers.IO) {
            try {
                val url = "${prefs.serverUrl}/api/v1/device/register"
                val bodyObj = RegisterDeviceRequest(
                    deviceId = prefs.deviceId,
                    name = "Samsung Galaxy A35 (BSNL Gateway)",
                    model = model,
                    androidVersion = androidVer,
                    simCarrier = carrier,
                    simSlot = slot
                )
                val jsonStr = gson.toJson(bodyObj)
                val request = Request.Builder()
                    .url(url)
                    .post(jsonStr.toRequestBody(jsonMediaType))
                    .build()

                httpClient.newCall(request).execute().use { response ->
                    val respBody = response.body?.string() ?: ""
                    val parsed = gson.fromJson(respBody, RegisterDeviceResponse::class.java)
                    if (response.isSuccessful && parsed.success && parsed.token != null && parsed.signingSecret != null) {
                        prefs.deviceToken = parsed.token
                        prefs.signingSecret = parsed.signingSecret
                        Result.success(parsed)
                    } else {
                        Result.failure(Exception(parsed.error?.message ?: "Registration failed HTTP ${response.code}"))
                    }
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun sendHeartbeat(battery: Int?, isCharging: Boolean?, carrier: String?, slot: Int?): Result<HeartbeatResponse> =
        withContext(Dispatchers.IO) {
            try {
                val url = "${prefs.serverUrl}/api/v1/device/heartbeat"
                val bodyObj = HeartbeatRequest(battery, isCharging, carrier, slot)
                val jsonStr = gson.toJson(bodyObj)
                val timestamp = (System.currentTimeMillis() / 1000).toString()

                val path = "/api/v1/device/heartbeat"
                val payloadToSign = "POST:$path:$timestamp:$jsonStr"
                val signature = prefs.signingSecret?.let { calculateHmac(payloadToSign, it) } ?: ""

                val request = Request.Builder()
                    .url(url)
                    .addHeader("X-Device-Id", prefs.deviceId)
                    .addHeader("X-Device-Token", prefs.deviceToken ?: "")
                    .addHeader("X-Device-Timestamp", timestamp)
                    .addHeader("X-Device-Signature", signature)
                    .post(jsonStr.toRequestBody(jsonMediaType))
                    .build()

                httpClient.newCall(request).execute().use { response ->
                    val respBody = response.body?.string() ?: ""
                    val parsed = gson.fromJson(respBody, HeartbeatResponse::class.java)
                    if (response.isSuccessful && parsed.success) {
                        Result.success(parsed)
                    } else {
                        Result.failure(Exception("Heartbeat error HTTP ${response.code}: $respBody"))
                    }
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun pollJobs(): Result<List<SmsJobPayload>> = withContext(Dispatchers.IO) {
        try {
            val url = "${prefs.serverUrl}/api/v1/device/poll-jobs"
            val timestamp = (System.currentTimeMillis() / 1000).toString()
            val path = "/api/v1/device/poll-jobs"
            val payloadToSign = "POST:$path:$timestamp:"
            val signature = prefs.signingSecret?.let { calculateHmac(payloadToSign, it) } ?: ""

            val emptyBody = "".toRequestBody(jsonMediaType)
            val request = Request.Builder()
                .url(url)
                .addHeader("X-Device-Id", prefs.deviceId)
                .addHeader("X-Device-Token", prefs.deviceToken ?: "")
                .addHeader("X-Device-Timestamp", timestamp)
                .addHeader("X-Device-Signature", signature)
                .post(emptyBody)
                .build()

            httpClient.newCall(request).execute().use { response ->
                val respBody = response.body?.string() ?: ""
                val parsed = gson.fromJson(respBody, PollJobsResponse::class.java)
                if (response.isSuccessful && parsed.success) {
                    Result.success(parsed.jobs)
                } else {
                    Result.failure(Exception("Poll error HTTP ${response.code}: $respBody"))
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun ackJob(
        jobId: String,
        status: String,
        rawResponse: String? = null,
        failureReason: String? = null,
        isUncertain: Boolean = false
    ): Result<AckJobResponse> = withContext(Dispatchers.IO) {
        try {
            val url = "${prefs.serverUrl}/api/v1/device/ack-job"
            val bodyObj = AckJobRequest(jobId, status, rawResponse, failureReason, isUncertain)
            val jsonStr = gson.toJson(bodyObj)
            val timestamp = (System.currentTimeMillis() / 1000).toString()

            val path = "/api/v1/device/ack-job"
            val payloadToSign = "POST:$path:$timestamp:$jsonStr"
            val signature = prefs.signingSecret?.let { calculateHmac(payloadToSign, it) } ?: ""

            val request = Request.Builder()
                .url(url)
                .addHeader("X-Device-Id", prefs.deviceId)
                .addHeader("X-Device-Token", prefs.deviceToken ?: "")
                .addHeader("X-Device-Timestamp", timestamp)
                .addHeader("X-Device-Signature", signature)
                .post(jsonStr.toRequestBody(jsonMediaType))
                .build()

            httpClient.newCall(request).execute().use { response ->
                val respBody = response.body?.string() ?: ""
                val parsed = gson.fromJson(respBody, AckJobResponse::class.java)
                if (response.isSuccessful && parsed.success) {
                    Result.success(parsed)
                } else {
                    Result.failure(Exception("Ack error HTTP ${response.code}: $respBody"))
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

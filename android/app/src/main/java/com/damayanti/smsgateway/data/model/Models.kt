package com.damayanti.smsgateway.data.model

data class RegisterDeviceRequest(
    val deviceId: String,
    val name: String,
    val model: String?,
    val androidVersion: String?,
    val simCarrier: String?,
    val simSlot: Int?
)

data class RegisterDeviceResponse(
    val success: Boolean,
    val device: DeviceMetadata?,
    val token: String?,
    val signingSecret: String?,
    val error: ApiError?
)

data class DeviceMetadata(
    val id: String,
    val deviceId: String,
    val name: String
)

data class HeartbeatRequest(
    val batteryLevel: Int?,
    val isCharging: Boolean?,
    val simCarrier: String?,
    val simSlot: Int?
)

data class HeartbeatResponse(
    val success: Boolean,
    val status: String?,
    val isPaused: Boolean,
    val isDisabled: Boolean,
    val pendingJobsCount: Int
)

data class PollJobsResponse(
    val success: Boolean,
    val count: Int,
    val jobs: List<SmsJobPayload>
)

data class SmsJobPayload(
    val id: String,
    val recipientNumber: String,
    val messageBody: String,
    val createdAt: String
)

data class AckJobRequest(
    val jobId: String,
    val status: String, // SENDING, SUBMITTED, FAILED
    val rawResponse: String? = null,
    val failureReason: String? = null,
    val isUncertainOutcome: Boolean = false
)

data class AckJobResponse(
    val success: Boolean,
    val jobId: String?,
    val status: String?
)

data class ApiError(
    val code: String,
    val message: String
)

data class SimCardInfo(
    val subscriptionId: Int,
    val slotIndex: Int,
    val carrierName: String,
    val displayName: String,
    val isBsnl: Boolean
)

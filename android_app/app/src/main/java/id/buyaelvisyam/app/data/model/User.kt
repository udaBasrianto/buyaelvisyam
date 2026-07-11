package id.buyaelvisyam.app.data.model

import com.google.gson.annotations.SerializedName

data class UserProfile(
    val id: String,
    val email: String,
    @SerializedName("display_name") val displayName: String,
    val role: String,
    @SerializedName("avatar_url") val avatarUrl: String?
)

data class LoginResponse(
    val token: String,
    val user: UserProfile
)

data class RegisterResponse(
    val message: String?
)

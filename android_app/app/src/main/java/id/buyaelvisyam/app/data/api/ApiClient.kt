package id.buyaelvisyam.app.data.api

import android.content.Context
import id.buyaelvisyam.app.BuildConfig
import id.buyaelvisyam.app.data.model.Article
import id.buyaelvisyam.app.data.model.LoginResponse
import id.buyaelvisyam.app.data.model.UserProfile
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body body: Map<String, String>): Response<LoginResponse>

    @POST("auth/register")
    suspend fun register(@Body body: Map<String, String>): Response<Unit>

    @GET("auth/me")
    suspend fun getMe(): Response<UserProfile>

    @GET("articles")
    suspend fun getArticles(
        @Query("limit") limit: Int,
        @Query("status") status: String,
        @Query("featured") featured: String? = null
    ): Response<List<Article>>
}

object ApiClient {
    // 10.0.2.2 points to localhost of the development computer from Android emulator
    private const val DEV_BASE_URL = "http://10.0.2.2:4000/api/"
    private const val PROD_BASE_URL = "https://buyaelvisyam.id/api/"

    private var retrofit: Retrofit? = null
    private var tokenProvider: (() -> String?)? = null

    fun initialize(context: Context) {
        val sharedPreferences = context.getSharedPreferences("buya_prefs", Context.MODE_PRIVATE)
        tokenProvider = { sharedPreferences.getString("token", null) }

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val authInterceptor = Interceptor { chain ->
            val requestBuilder = chain.request().newBuilder()
            val token = tokenProvider?.invoke()
            if (!token.isNullOrEmpty()) {
                requestBuilder.addHeader("Authorization", "Bearer $token")
            }
            chain.proceed(requestBuilder.build())
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .build()

        val baseUrl = if (BuildConfig.DEBUG) DEV_BASE_URL else PROD_BASE_URL
        retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val apiService: ApiService by lazy {
        retrofit?.create(ApiService::class.java) 
            ?: throw IllegalStateException("ApiClient must be initialized with context first")
    }

    fun saveToken(context: Context, token: String) {
        context.getSharedPreferences("buya_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("token", token)
            .apply()
    }

    fun clearToken(context: Context) {
        context.getSharedPreferences("buya_prefs", Context.MODE_PRIVATE)
            .edit()
            .remove("token")
            .apply()
    }
}

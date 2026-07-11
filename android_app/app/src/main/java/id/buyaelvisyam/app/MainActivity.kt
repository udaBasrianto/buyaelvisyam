package id.buyaelvisyam.app

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import id.buyaelvisyam.app.data.api.ApiClient
import id.buyaelvisyam.app.data.model.Article
import id.buyaelvisyam.app.data.model.UserProfile
import id.buyaelvisyam.app.ui.screens.ArticleDetailScreen
import id.buyaelvisyam.app.ui.screens.AuthScreen
import id.buyaelvisyam.app.ui.screens.HomeScreen
import id.buyaelvisyam.app.ui.theme.BuyaTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState)
        
        // Initialize API Client with application context
        ApiClient.initialize(applicationContext)

        setContent {
            BuyaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = androidx.compose.material3.MaterialTheme.colorScheme.background
                ) {
                    AppNavigation(context = this@MainActivity)
                }
            }
        }
    }
}

sealed class Screen {
    object Auth : Screen()
    object Home : Screen()
    object ArticleDetail : Screen()
}

@Composable
fun AppNavigation(context: Context) {
    val sharedPreferences = remember { context.getSharedPreferences("buya_prefs", Context.MODE_PRIVATE) }
    var currentScreen by remember { 
        mutableStateOf<Screen>(
            if (sharedPreferences.getString("token", null) != null) Screen.Home else Screen.Auth
        ) 
    }
    var selectedArticle by remember { mutableStateOf<Article?>(null) }
    var currentUserProfile by remember { mutableStateOf<UserProfile?>(null) }

    // Fetch user profile if token is present
    LaunchedEffect(currentScreen) {
        if (currentScreen == Screen.Home && currentUserProfile == null) {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val response = ApiClient.apiService.getMe()
                    if (response.isSuccessful && response.body() != null) {
                        currentUserProfile = response.body()
                    } else {
                        // Clear invalid token and send to Login
                        ApiClient.clearToken(context)
                        currentUserProfile = null
                        currentScreen = Screen.Auth
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    when (currentScreen) {
        is Screen.Auth -> {
            AuthScreen(
                context = context,
                onLoginSuccess = { userProfile ->
                    currentUserProfile = userProfile
                    currentScreen = Screen.Home
                }
            )
        }
        is Screen.Home -> {
            HomeScreen(
                context = context,
                userProfile = currentUserProfile,
                onArticleClick = { article ->
                    selectedArticle = article
                    currentScreen = Screen.ArticleDetail
                },
                onLogout = {
                    ApiClient.clearToken(context)
                    currentUserProfile = null
                    currentScreen = Screen.Auth
                }
            )
        }
        is Screen.ArticleDetail -> {
            selectedArticle?.let { article ->
                ArticleDetailScreen(
                    article = article,
                    onBackClick = {
                        selectedArticle = null
                        currentScreen = Screen.Home
                    }
                )
            } ?: run {
                currentScreen = Screen.Home
            }
        }
    }
}

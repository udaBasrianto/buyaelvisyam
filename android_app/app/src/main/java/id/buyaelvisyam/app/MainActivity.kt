package id.buyaelvisyam.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import id.buyaelvisyam.app.data.api.ApiClient
import id.buyaelvisyam.app.data.model.Article
import id.buyaelvisyam.app.data.model.UserProfile
import id.buyaelvisyam.app.ui.screens.ArticleDetailScreen
import id.buyaelvisyam.app.ui.screens.AuthScreen
import id.buyaelvisyam.app.ui.screens.HomeScreen
import id.buyaelvisyam.app.ui.theme.BuyaTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize API Client with application context (not Activity context)
        ApiClient.initialize(applicationContext)

        setContent {
            BuyaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = androidx.compose.material3.MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
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
fun AppNavigation() {
    // Use LocalContext.current instead of passing Activity context — safe across recompositions
    val context = LocalContext.current
    val sharedPreferences = remember { context.getSharedPreferences("buya_prefs", context.MODE_PRIVATE) }

    var currentScreen by remember { mutableStateOf<Screen>(Screen.Home) }
    var selectedArticle by remember { mutableStateOf<Article?>(null) }
    var currentUserProfile by remember { mutableStateOf<UserProfile?>(null) }

    // Fetch user profile when landing on Home with a stored token.
    // Uses LaunchedEffect's own coroutine scope (lifecycle-aware, no manual CoroutineScope needed).
    LaunchedEffect(currentScreen) {
        if (currentScreen == Screen.Home && currentUserProfile == null) {
            val token = sharedPreferences.getString("token", null)
            if (!token.isNullOrEmpty()) {
                try {
                    // IO work on IO dispatcher, then switch back to Main for state mutation
                    val response = withContext(Dispatchers.IO) {
                        ApiClient.apiService.getMe()
                    }
                    // State mutation is now safely on the Main thread (LaunchedEffect resumes on Main)
                    if (response.isSuccessful && response.body() != null) {
                        currentUserProfile = response.body()
                    } else {
                        ApiClient.clearToken(context)
                        currentUserProfile = null
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    // Handle device back-press: ArticleDetail → Home, Home/Auth → let system handle (exit)
    BackHandler(enabled = currentScreen is Screen.ArticleDetail) {
        selectedArticle = null
        currentScreen = Screen.Home
    }

    when (currentScreen) {
        is Screen.Auth -> {
            AuthScreen(
                onLoginSuccess = { userProfile ->
                    currentUserProfile = userProfile
                    currentScreen = Screen.Home
                }
            )
        }
        is Screen.Home -> {
            HomeScreen(
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
            // Guard: if article is null (shouldn't happen but be safe), go back to Home
            // Use LaunchedEffect so the state change happens outside of composition
            val article = selectedArticle
            if (article != null) {
                ArticleDetailScreen(
                    article = article,
                    onBackClick = {
                        selectedArticle = null
                        currentScreen = Screen.Home
                    }
                )
            } else {
                LaunchedEffect(Unit) {
                    currentScreen = Screen.Home
                }
            }
        }
    }
}

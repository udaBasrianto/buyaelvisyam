package id.buyaelvisyam.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import id.buyaelvisyam.app.data.api.ApiClient
import id.buyaelvisyam.app.data.model.Article
import id.buyaelvisyam.app.data.model.UserProfile
import id.buyaelvisyam.app.ui.theme.Teal700
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    userProfile: UserProfile?,
    onArticleClick: (Article) -> Unit,
    onLogout: () -> Unit
) {
    // Use LocalContext.current — safe across recompositions, no stale Activity reference
    val context = LocalContext.current

    var latestArticles by remember { mutableStateOf<List<Article>>(emptyList()) }
    var featuredArticles by remember { mutableStateOf<List<Article>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    // loadData is extracted as a lambda so it can be called from both
    // LaunchedEffect (initial load) and button click handlers without duplication.
    val loadData: () -> Unit = {
        // State mutations here run on the Main thread (called from composable scope)
        isLoading = true
        errorMessage = null
        scope.launch(Dispatchers.IO) {
            try {
                val latestResponse = ApiClient.apiService.getArticles(limit = 20, status = "published")
                val featuredResponse = ApiClient.apiService.getArticles(limit = 6, status = "published", featured = "true")
                withContext(Dispatchers.Main) {
                    if (latestResponse.isSuccessful && featuredResponse.isSuccessful) {
                        latestArticles = latestResponse.body() ?: emptyList()
                        featuredArticles = featuredResponse.body() ?: emptyList()
                    } else {
                        errorMessage = "Gagal memuat artikel dari server."
                    }
                    isLoading = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    errorMessage = "Koneksi backend gagal. Hubungkan ke Wi-Fi yang sama."
                    isLoading = false
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Buya Mobile",
                            fontWeight = FontWeight.Bold,
                            color = Teal700,
                            fontSize = 18.sp
                        )
                        if (userProfile != null) {
                            Text(
                                text = "Assalamualaikum, ${userProfile.displayName}",
                                fontSize = 11.sp,
                                color = Color.Gray
                            )
                        } else {
                            Text(
                                text = "Selamat datang, Tamu",
                                fontSize = 11.sp,
                                color = Color.Gray
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = { loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    IconButton(onClick = onLogout) {
                        if (userProfile != null) {
                            Icon(Icons.Default.ExitToApp, contentDescription = "Log Keluar", tint = Color.Red)
                        } else {
                            Icon(Icons.Default.Lock, contentDescription = "Log Masuk", tint = Teal700)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = Teal700
                )
            } else if (errorMessage != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = errorMessage!!,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        color = Color.Red,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { loadData() },
                        colors = ButtonDefaults.buttonColors(containerColor = Teal700)
                    ) {
                        Text("Coba Lagi")
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 24.dp)
                ) {
                    // Featured Articles Slider
                    if (featuredArticles.isNotEmpty()) {
                        item {
                            Row(
                                modifier = Modifier.padding(start = 16.dp, top = 16.dp, bottom = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.Star,
                                    contentDescription = null,
                                    tint = Color(0xFFFFB300),
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Artikel Pilihan",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF1F2937)
                                )
                            }
                            LazyRow(
                                contentPadding = PaddingValues(horizontal = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(featuredArticles) { article ->
                                    FeaturedCard(article = article, onClick = { onArticleClick(article) })
                                }
                            }
                        }
                    }

                    // Latest Articles Header
                    item {
                        Text(
                            text = "Artikel Terbaru",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1F2937),
                            modifier = Modifier.padding(start = 16.dp, top = 24.dp, bottom = 12.dp)
                        )
                    }

                    // Latest Articles List
                    if (latestArticles.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(48.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("Tidak ada artikel terbaru.", color = Color.Gray, fontSize = 14.sp)
                            }
                        }
                    } else {
                        items(latestArticles) { article ->
                            ArticleRow(article = article, onClick = { onArticleClick(article) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FeaturedCard(article: Article, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .width(260.dp)
            .height(180.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            AsyncImage(
                model = article.coverImage,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            // Translucent overlay for text legibility
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.45f))
            )
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(14.dp),
                verticalArrangement = Arrangement.Bottom
            ) {
                // article.category is nullable — use safe fallback
                val categoryLabel = article.category?.uppercase()
                    ?: article.categories?.firstOrNull()?.uppercase()
                    ?: ""
                if (categoryLabel.isNotEmpty()) {
                    Text(
                        text = categoryLabel,
                        color = Color(0xFF2DD4BF),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }
                Text(
                    text = article.title,
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "👁️ ${article.views}  •  ${formatDate(article.createdAt)}",
                    color = Color.LightGray,
                    fontSize = 10.sp
                )
            }
        }
    }
}

@Composable
fun ArticleRow(article: Article, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp)
        ) {
            AsyncImage(
                model = article.coverImage,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(8.dp))
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(
                modifier = Modifier
                    .weight(1f)
                    .height(80.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    // article.category is nullable — fall back to categories list or empty string
                    val categoryLabel = article.category?.uppercase()
                        ?: article.categories?.firstOrNull()?.uppercase()
                        ?: ""
                    if (categoryLabel.isNotEmpty()) {
                        Text(
                            text = categoryLabel,
                            color = Teal700,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                    }
                    Text(
                        text = article.title,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1F2937),
                        fontSize = 13.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // article.author is nullable — safe fallback to "Anonim"
                    Text(
                        text = "Oleh ${article.author ?: "Anonim"}",
                        color = Color.Gray,
                        fontSize = 10.sp
                    )
                    Text(
                        text = "👁️ ${article.views}  •  ${calculateReadingMinutes(article.content)} mnt",
                        color = Color.Gray,
                        fontSize = 10.sp
                    )
                }
            }
        }
    }
}

// formatDate and calculateReadingMinutes live in Utils.kt — no duplicates here

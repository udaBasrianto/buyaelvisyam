package id.buyaelvisyam.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import id.buyaelvisyam.app.data.model.Article
import id.buyaelvisyam.app.ui.theme.Teal700
import id.buyaelvisyam.app.ui.theme.YoutubeRed

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArticleDetailScreen(
    article: Article,
    onBackClick: () -> Unit
) {
    val scrollState = rememberScrollState()
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        text = article.category,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Teal700
                    ) 
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Kembali")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(scrollState)
                .background(Color.White)
        ) {
            // Cover Image
            AsyncImage(
                model = article.coverImage,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(240.dp)
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                // Title
                Text(
                    text = article.title,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1F2937),
                    lineHeight = 26.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Author & Meta Info
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Teal700.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = (article.author ?: "U").substring(0, 1).uppercase(),
                            color = Teal700,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = article.author ?: "Ustadz",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = Color(0xFF374151)
                        )
                        Text(
                            text = formatDate(article.createdAt),
                            fontSize = 11.sp,
                            color = Color.Gray
                        )
                    }
                    Text(
                        text = "👁️ ${article.views} pembaca",
                        fontSize = 11.sp,
                        color = Color.Gray
                    )
                }

                Divider(modifier = Modifier.padding(vertical = 20.dp), color = Color(0xFFE5E7EB))

                // YouTube Card Integration
                if (!article.youtubeUrl.isNullOrEmpty()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFFEF2F2), shape = RoundedCornerShape(12.dp))
                            .clickable {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(article.youtubeUrl))
                                context.startActivity(intent)
                            }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.PlayArrow,
                            contentDescription = null,
                            tint = YoutubeRed,
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Tonton Video Terkait",
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF991B1B),
                                fontSize = 13.sp
                            )
                            Text(
                                text = "Artikel ini dilengkapi penjelasan video",
                                color = Color(0xFF7F1D1D),
                                fontSize = 11.sp
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                }

                // Main Article Body
                Text(
                    text = parseHtmlToAnnotatedString(article.content),
                    fontSize = 14.sp,
                    lineHeight = 22.sp,
                    color = Color(0xFF374151)
                )

                Spacer(modifier = Modifier.height(48.dp))
            }
        }
    }
}

private fun formatDate(dateStr: String): String {
    return if (dateStr.length >= 10) dateStr.substring(0, 10) else dateStr
}

// Simple and robust parser for basic HTML tags in Compose
private fun parseHtmlToAnnotatedString(htmlContent: String): AnnotatedString {
    val clean = htmlContent
        .replace("</p>", "\n\n")
        .replace("<p>", "")
        .replace(Regex("<br\\s*/?>"), "\n")
        .replace("<li>", "• ")
        .replace("</li>", "\n")
        .replace("</ul>", "")
        .replace("<ul>", "")
        .replace("</ol>", "")
        .replace("<ol>", "")
        .replace("&amp;", "&")
        .replace("&nbsp;", " ")
        .trim()

    return buildAnnotatedString {
        val regExp = Regex("(<strong>|<b>)(.*?)(</strong>|</b>)|(<em>|<i>)(.*?)(</em>|</i>)|([^<]+)")
        val matches = regExp.findAll(clean)
        for (match in matches) {
            val boldText = match.groups[2]?.value
            val italicText = match.groups[5]?.value
            val plainText = match.groups[7]?.value

            if (boldText != null) {
                pushStyle(SpanStyle(fontWeight = FontWeight.Bold))
                append(boldText)
                pop()
            } else if (italicText != null) {
                pushStyle(SpanStyle(fontStyle = FontStyle.Italic))
                append(italicText)
                pop()
            } else if (plainText != null) {
                append(plainText)
            }
        }
        if (length == 0) {
            append(clean)
        }
    }
}

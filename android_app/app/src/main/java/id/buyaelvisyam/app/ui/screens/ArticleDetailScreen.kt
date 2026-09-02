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
import androidx.compose.material.icons.automirrored.filled.ArrowBack  // replaces deprecated ArrowBack
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
import androidx.compose.ui.text.style.TextDecoration
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

    // Resolve category display: prefer category field, fall back to first item in categories list
    val categoryDisplay = article.category
        ?: article.categories?.firstOrNull()
        ?: ""

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = categoryDisplay,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Teal700,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        // AutoMirrored variant — correct for RTL locales, not deprecated
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Kembali"
                        )
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // article.author is nullable — safe fallback for avatar initial
                    val authorName = article.author ?: "Ustadz"
                    val avatarInitial = authorName.firstOrNull()?.uppercaseChar()?.toString() ?: "U"

                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Teal700.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = avatarInitial,
                            color = Teal700,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = authorName,
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

                // HorizontalDivider replaces deprecated Divider
                HorizontalDivider(
                    modifier = Modifier.padding(vertical = 20.dp),
                    color = Color(0xFFE5E7EB)
                )

                // YouTube Card
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

                // Main Article Body — rendered via improved HTML parser
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

/**
 * Converts a subset of HTML to Compose AnnotatedString.
 *
 * Handled tags:
 *   Block  : <p>, <br>, <ul>, <ol>, <li>, <h1>–<h6>, <blockquote>
 *   Inline : <strong>/<b>, <em>/<i>, <u>, <s>/<strike>/<del>, <a href>
 *   Entities: &amp; &nbsp; &lt; &gt; &quot; &#39; &#160;
 *
 * Unknown/remaining tags are stripped (not passed through as raw HTML).
 */
private fun parseHtmlToAnnotatedString(htmlContent: String): AnnotatedString {
    // --- Step 1: block-level tag → newline normalisation ---
    val preprocessed = htmlContent
        // Headings → bold marker + newlines (we handle bold in step 2)
        .replace(Regex("<h[1-6][^>]*>", RegexOption.IGNORE_CASE), "\n\n<b>")
        .replace(Regex("</h[1-6]>", RegexOption.IGNORE_CASE), "</b>\n\n")
        // Paragraphs
        .replace(Regex("<p[^>]*>", RegexOption.IGNORE_CASE), "")
        .replace(Regex("</p>", RegexOption.IGNORE_CASE), "\n\n")
        // Line breaks
        .replace(Regex("<br\\s*/?>", RegexOption.IGNORE_CASE), "\n")
        // Lists
        .replace(Regex("<[/]?ul[^>]*>", RegexOption.IGNORE_CASE), "\n")
        .replace(Regex("<[/]?ol[^>]*>", RegexOption.IGNORE_CASE), "\n")
        .replace(Regex("<li[^>]*>", RegexOption.IGNORE_CASE), "\n• ")
        .replace(Regex("</li>", RegexOption.IGNORE_CASE), "")
        // Blockquotes
        .replace(Regex("<blockquote[^>]*>", RegexOption.IGNORE_CASE), "\n\n  ")
        .replace(Regex("</blockquote>", RegexOption.IGNORE_CASE), "\n\n")
        // Divs / sections
        .replace(Regex("<div[^>]*>", RegexOption.IGNORE_CASE), "")
        .replace(Regex("</div>", RegexOption.IGNORE_CASE), "\n")
        // Common HTML entities
        .replace("&amp;", "&")
        .replace("&nbsp;", " ")
        .replace("&#160;", " ")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .trim()

    // --- Step 2: inline span parsing with AnnotatedString builder ---
    return buildAnnotatedString {
        // Regex alternatives (order matters — most specific first):
        //   1. <strong> / <b>  …  </strong> / </b>
        //   2. <em> / <i>      …  </em> / </i>
        //   3. <u>             …  </u>
        //   4. <s> / <strike> / <del>  …  </s> / </strike> / </del>
        //   5. <a href="…">    …  </a>   — rendered as underlined teal text
        //   6. Any remaining unknown tag  — stripped entirely
        //   7. Plain text between tags
        val tagRegex = Regex(
            """(<(?:strong|b)>)(.*?)(</(?:strong|b)>)""" +
            """|(<(?:em|i)>)(.*?)(</(?:em|i)>)""" +
            """|(<u>)(.*?)(</u>)""" +
            """|(<(?:s|strike|del)>)(.*?)(</(?:s|strike|del)>)""" +
            """|<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)</a>""" +
            """|<[^>]+>""" +             // strip any remaining unknown tag
            """|([^<]+)""",              // plain text
            setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL)
        )

        for (match in tagRegex.findAll(preprocessed)) {
            when {
                // Bold
                match.groups[2] != null -> {
                    pushStyle(SpanStyle(fontWeight = FontWeight.Bold))
                    append(match.groups[2]!!.value)
                    pop()
                }
                // Italic
                match.groups[5] != null -> {
                    pushStyle(SpanStyle(fontStyle = FontStyle.Italic))
                    append(match.groups[5]!!.value)
                    pop()
                }
                // Underline
                match.groups[8] != null -> {
                    pushStyle(SpanStyle(textDecoration = TextDecoration.Underline))
                    append(match.groups[8]!!.value)
                    pop()
                }
                // Strikethrough
                match.groups[11] != null -> {
                    pushStyle(SpanStyle(textDecoration = TextDecoration.LineThrough))
                    append(match.groups[11]!!.value)
                    pop()
                }
                // Anchor / link — show link text in teal underlined; href is not clickable
                // (making inline text clickable in AnnotatedString needs ClickableText which
                //  has its own complexity — plain styling is safer for now)
                match.groups[13] != null -> {
                    pushStyle(SpanStyle(color = Teal700, textDecoration = TextDecoration.Underline))
                    append(match.groups[13]!!.value)  // link text (group 13)
                    pop()
                }
                // Unknown tag matched by <[^>]+> — groups are all null, value is the tag: skip it
                match.value.startsWith("<") -> { /* stripped — intentionally empty */ }
                // Plain text (group 14)
                match.groups[14] != null -> append(match.groups[14]!!.value)
            }
        }

        // Fallback: if nothing was appended (e.g. content was all tags), show stripped plain text
        if (length == 0) {
            append(preprocessed.replace(Regex("<[^>]+>"), "").trim())
        }
    }
}

// formatDate lives in Utils.kt — no duplicate here

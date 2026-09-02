package id.buyaelvisyam.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.buyaelvisyam.app.data.api.ApiClient
import id.buyaelvisyam.app.data.model.UserProfile
import id.buyaelvisyam.app.ui.theme.Teal200
import id.buyaelvisyam.app.ui.theme.Teal700
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    onLoginSuccess: (UserProfile) -> Unit
) {
    val context = LocalContext.current
    var isLogin by remember { mutableStateOf(true) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var adminToken by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var passwordVisible by remember { mutableStateOf(false) }

    // Inline field error states — shown beneath each field as the user types
    var nameError by remember { mutableStateOf<String?>(null) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }

    // Reset errors when switching between login / register
    val onModeSwitch = {
        nameError = null
        emailError = null
        passwordError = null
        isLogin = !isLogin
    }

    val scrollState = rememberScrollState()
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(scrollState)
                .background(Color.White, shape = RoundedCornerShape(20.dp))
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // App Logo Placeholder
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(Teal200.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "B",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Black,
                    color = Teal700
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = if (isLogin) "Masuk ke Buya App" else "Daftar Akun Baru",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )

            Text(
                text = if (isLogin) "Silakan masuk untuk membaca artikel" else "Lengkapi form untuk mendaftar",
                fontSize = 13.sp,
                color = Color.Gray,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Name Field (Register only)
            if (!isLogin) {
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        nameError = if (it.trim().length < 2 && it.isNotEmpty()) "Nama minimal 2 karakter" else null
                    },
                    label = { Text("Nama Lengkap") },
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                    isError = nameError != null,
                    supportingText = { if (nameError != null) Text(nameError!!, color = MaterialTheme.colorScheme.error) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Email Field
            OutlinedTextField(
                value = email,
                onValueChange = {
                    email = it
                    emailError = if (it.isNotEmpty() && (!it.contains("@") || !it.contains("."))) "Format email tidak valid" else null
                },
                label = { Text("Alamat Email") },
                leadingIcon = { Icon(Icons.Default.MailOutline, contentDescription = null) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                isError = emailError != null,
                supportingText = { if (emailError != null) Text(emailError!!, color = MaterialTheme.colorScheme.error) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Password Field
            OutlinedTextField(
                value = password,
                onValueChange = {
                    password = it
                    passwordError = if (it.isNotEmpty() && it.length < 8) "Password minimal 8 karakter" else null
                },
                label = { Text("Kata Sandi") },
                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = {
                    TextButton(onClick = { passwordVisible = !passwordVisible }) {
                        Text(
                            text = if (passwordVisible) "Sembunyikan" else "Tampilkan",
                            color = Teal700,
                            fontSize = 12.sp
                        )
                    }
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                isError = passwordError != null,
                supportingText = { if (passwordError != null) Text(passwordError!!, color = MaterialTheme.colorScheme.error) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp)
            )

            // Admin Token Field (Login only)
            if (isLogin) {
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = adminToken,
                    onValueChange = { adminToken = it },
                    label = { Text("Token Admin (Opsional)") },
                    leadingIcon = { Icon(Icons.Default.Star, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Submit Button
            Button(
                onClick = {
                    if (email.isEmpty() || password.isEmpty()) {
                        Toast.makeText(context, "Email dan password tidak boleh kosong", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (!email.contains("@") || !email.contains(".")) {
                        Toast.makeText(context, "Format email tidak valid", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (password.length < 8) {
                        Toast.makeText(context, "Password minimal 8 karakter", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (!isLogin && name.isEmpty()) {
                        Toast.makeText(context, "Nama tidak boleh kosong", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (!isLogin && name.trim().length < 2) {
                        Toast.makeText(context, "Nama minimal 2 karakter", Toast.LENGTH_SHORT).show()
                        return@Button
                    }

                    isLoading = true
                    scope.launch(Dispatchers.IO) {
                        try {
                            if (isLogin) {
                                val body = mapOf(
                                    "email" to email.trim(),
                                    "password" to password,
                                    "token" to adminToken.trim()
                                )
                                val response = ApiClient.apiService.login(body)
                                withContext(Dispatchers.Main) {
                                    isLoading = false
                                    if (response.isSuccessful && response.body() != null) {
                                        val loginData = response.body()!!
                                        ApiClient.saveToken(context, loginData.token)
                                        onLoginSuccess(loginData.user)
                                        Toast.makeText(context, "Berhasil masuk!", Toast.LENGTH_SHORT).show()
                                    } else {
                                        Toast.makeText(context, "Gagal masuk. Periksa kembali email dan sandi.", Toast.LENGTH_LONG).show()
                                    }
                                }
                            } else {
                                val body = mapOf(
                                    "email" to email.trim(),
                                    "password" to password,
                                    "display_name" to name.trim()
                                )
                                val response = ApiClient.apiService.register(body)
                                withContext(Dispatchers.Main) {
                                    isLoading = false
                                    if (response.isSuccessful) {
                                        Toast.makeText(context, "Daftar berhasil! Silakan masuk.", Toast.LENGTH_LONG).show()
                                        isLogin = true
                                    } else {
                                        Toast.makeText(context, "Daftar gagal. Email mungkin sudah digunakan.", Toast.LENGTH_LONG).show()
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            withContext(Dispatchers.Main) {
                                isLoading = false
                                Toast.makeText(context, "Koneksi backend gagal. Hubungkan ke Wi-Fi yang sama.", Toast.LENGTH_LONG).show()
                            }
                        }
                    }
                },
                enabled = !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Teal700)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Text(
                        text = if (isLogin) "Masuk" else "Daftar",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Switch Mode Button
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = if (isLogin) "Belum punya akun?" else "Sudah memiliki akun?",
                    color = Color.Gray,
                    fontSize = 13.sp
                )
                TextButton(onClick = { onModeSwitch() }) {
                    Text(
                        text = if (isLogin) "Daftar" else "Masuk",
                        color = Teal700,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}

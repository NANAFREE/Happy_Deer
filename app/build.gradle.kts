plugins {
    alias(libs.plugins.androidApplication)
}

android {
    namespace = "com.example.happy_deer"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.happy_deer"
        minSdk = 24
        targetSdk = 34
        versionCode = 2
        versionName = "1.4"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
}

dependencies {

    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.activity)
    implementation(libs.constraintlayout)
    implementation(files("libs\\sqlite-jdbc-3.28.0-javadoc.jar"))
    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.nanohttpd:nanohttpd:2.3.0")
    implementation("com.github.PhilJay:MPAndroidChart:v3.0.2")
}
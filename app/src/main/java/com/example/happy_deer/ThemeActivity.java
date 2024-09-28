package com.example.happy_deer;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;


public class ThemeActivity extends AppCompatActivity {

    private Toast currentToast; // 声明一个 Toast 对象

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_theme);

        TextView theme_default = findViewById(R.id.theme_default);
        TextView theme_deer = findViewById(R.id.theme_deer);
        TextView theme_flow = findViewById(R.id.theme_Flow);

        theme_default.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showToast("测试开发使用中");
                SharedPreferences sharedPreferences = getSharedPreferences("theme", MODE_PRIVATE);
                SharedPreferences.Editor edit = sharedPreferences.edit();
                edit.clear();
                edit.apply();
            }
        });

        theme_deer.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showToast("测试开发使用中");
                SharedPreferences sharedPreferences = getSharedPreferences("theme", MODE_PRIVATE);
                SharedPreferences.Editor edit = sharedPreferences.edit();
                edit.putString("btn_text","开撸");
                edit.apply();
            }
        });

        theme_flow.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showToast("开发中");
            }
        });

    }

    private void showToast(String message) {
        // 如果当前有 Toast 在显示，取消它
        if (currentToast != null) {
            currentToast.cancel(); // 取消当前的 Toast
        }
        // 创建新 Toast
        currentToast = Toast.makeText(getApplicationContext(), message, Toast.LENGTH_LONG);
        currentToast.show(); // 显示新 Toast
    }
}
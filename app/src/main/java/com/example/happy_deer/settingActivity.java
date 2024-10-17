package com.example.happy_deer;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;



public class settingActivity extends AppCompatActivity {
    private int Developers_flag = 1;
    private Toast currentToast; // 声明一个 Toast 对象

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_setting);

        TextView ThemeSetting = findViewById(R.id.themeSetting);
        TextView StyleSetting = findViewById(R.id.styleSetting);
        TextView dateSetting = findViewById(R.id.dateSetting);
        TextView version = findViewById(R.id.version);
        LinearLayout warning = findViewById(R.id.warning);
        TextView dataExport = findViewById(R.id.dataExport);

        ThemeSetting.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent theme = new Intent(settingActivity.this, ThemeActivity.class);
                startActivity(theme);
            }
        });

        StyleSetting.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent Style = new Intent(settingActivity.this, StyleActivity.class);
                startActivity(Style);
            }
        });

        dateSetting.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent Data = new Intent(settingActivity.this, DataManagementActivity.class);
                startActivity(Data);
            }
        });

        version.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Developers_flag++;
                if (Developers_flag == 7){
                    Log.d("Setting","进入开发者模式");
                    warning.setVisibility(View.VISIBLE);
                    Toast.makeText(getApplicationContext(),"当前是开发者模式",Toast.LENGTH_LONG).show();
                }
                // 获取应用的包管理器
                PackageManager packageManager = getPackageManager();
                String packageName = getPackageName();

                try {
                    // 获取应用的信息
                    PackageInfo packageInfo = packageManager.getPackageInfo(packageName, 0);
                    String versionName = packageInfo.versionName; // 获取版本名称
                    int versionCode = packageInfo.versionCode;   // 获取版本号

                    // 显示版本信息（可以根据需要选择显示方式，例如Toast或者对话框）
                    showToast("当前版本:" + versionName);
                } catch (PackageManager.NameNotFoundException e) {
                    e.printStackTrace();
                }
            }
        });

        warning.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent Developers = new Intent(settingActivity.this, DevelopersActivity.class);
                startActivity(Developers);
            }
        });

        //跳转导入导出页面
        dataExport.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent dataExport = new Intent(settingActivity.this, DataExporitActivity.class);
                startActivity(dataExport);
            }
        });

    }

//    它应该用在某种需要思考判断来防止意外发生的提示
    public void showAlertDialog(String title,String msg) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle(title)
                .setMessage(msg)
                .setPositiveButton("确定", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        // 点击“确定”按钮后的处理逻辑（可选）
                        dialog.dismiss(); // 关闭对话框
                    }
                })
                .setNegativeButton("取消", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.cancel(); // 关闭对话框
                    }
                });
        // 创建并显示对话框
        AlertDialog dialog = builder.create();
        dialog.show();
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
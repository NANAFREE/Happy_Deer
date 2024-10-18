package com.example.happy_deer;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

public class DataExporitActivity extends AppCompatActivity {

    private static final int PICK_FILE_REQUEST = 1;
    private DBOpenHelper dbOpenHelper;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_data_exporit);

        // 初始化 DBOpenHelper
        dbOpenHelper = new DBOpenHelper(this,"HealthRecords.db", null, 1);

        TextView exportData = findViewById(R.id.ExportData);
        TextView importData = findViewById(R.id.ImportData);
        TextView ClearData = findViewById(R.id.ClearData);

        //导出
        exportData.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                HealthRecordManager healthRecordManager = new HealthRecordManager(DataExporitActivity.this);
                healthRecordManager.exportDatabaseToCSV();
            }
        });

        //导入
        importData.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                onSelectFileButtonClick(v);
            }
        });

        //清除
        ClearData.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                HealthRecordManager healthRecordManager = new HealthRecordManager(DataExporitActivity.this);
                healthRecordManager.clearAppFolder();
            }
        });

    }



    public void onSelectFileButtonClick(View view) {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*"); // 选择所有类型的文件
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        startActivityForResult(Intent.createChooser(intent, "Select a file"), PICK_FILE_REQUEST);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == PICK_FILE_REQUEST && resultCode == RESULT_OK) {
            if (data != null) {
                Uri uri = data.getData(); // 获取用户选择的文件的 URI
                importData(this, uri); // 调用导入方法
                Log.d("HealthRecordManager",uri.toString());
            }
        }
    }


    // 数据导入方法
    public void importData(Context context, Uri uri) {
        SQLiteDatabase db = dbOpenHelper.getWritableDatabase(); // 使用可写数据库
        BufferedReader bufferedReader;

        try {
            InputStream inputStream = context.getContentResolver().openInputStream(uri);
            bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
            String line;

            // 跳过表头
            bufferedReader.readLine();

            while ((line = bufferedReader.readLine()) != null) {
                String[] values = line.split(",");

                // 确保 values 数组的长度正确
                if (values.length < 6) { // ID 不需要提供
                    Log.e("DataImportActivity", "Invalid line: " + line);
                    continue; // 跳过无效行
                }

                // 创建 ContentValues 对象
                ContentValues contentValues = new ContentValues();

                // Date
                if (values[0] != null && !values[0].trim().isEmpty()) {
                    contentValues.put("Date", values[0]);
                } else {
                    Log.e("DataImportActivity", "Date is null or empty in line: " + line);
                    continue; // 跳过无效行
                }

                // Time
                if (values[1] != null && !values[1].trim().isEmpty()) {
                    contentValues.put("Time", values[1]);
                } else {
                    Log.e("DataImportActivity", "Time is null or empty in line: " + line);
                    continue; // 跳过无效行
                }

                // Frequency
                try {
                    if (values[2] != null && !values[2].trim().isEmpty() && !values[2].equalsIgnoreCase("null")) {
                        contentValues.put("Frequency", Integer.parseInt(values[2]));
                    } else {
                        Log.e("DataImportActivity", "Frequency is null or empty in line: " + line);
                        contentValues.put("Frequency", 1); // 使用默认值
                    }
                } catch (NumberFormatException e) {
                    Log.e("DataImportActivity", "Invalid Frequency value in line: " + line + " - " + e.getMessage());
                    contentValues.put("Frequency", 1); // 使用默认值
                }

                // Last_datetime
                if (values[3] != null && !values[3].trim().isEmpty()) {
                    contentValues.put("Last_datetime", values[3]);
                } else {
                    Log.e("DataImportActivity", "Last_datetime is null or empty in line: " + line);
                    continue; // 跳过无效行
                }

                // Interval_time
                try {
                    if (values[4] != null && !values[4].trim().isEmpty() && !values[4].equalsIgnoreCase("null")) {
                        contentValues.put("Interval_time", Integer.parseInt(values[4]));
                    } else {
                        Log.e("DataImportActivity", "Interval_time is null or empty in line: " + line);
                        contentValues.put("Interval_time", (String) null); // 可以选择不插入或插入 NULL
                    }
                } catch (NumberFormatException e) {
                    Log.e("DataImportActivity", "Invalid Interval_time value in line: " + line + " - " + e.getMessage());
                    contentValues.put("Interval_time", (String) null); // 可以选择不插入或插入 NULL
                }

                // Remarks
                if (values.length > 5) {
                    contentValues.put("Remarks", values[5]);
                } else {
                    contentValues.put("Remarks", ""); // 默认值
                }

                // 插入数据
                long result = db.insert("HealthRecords", null, contentValues);
                if (result == -1) {
                    Log.e("DataImportActivity", "Failed to insert data: " + contentValues.toString());
                } else {
                    Log.d("DataImportActivity", "Inserted data with ID: " + result);
                }
            }

            bufferedReader.close();
            Toast.makeText(context, "Import Successful", Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(context, "Import Failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        } finally {
            db.close(); // 确保数据库在操作完成后关闭
        }
    }



}
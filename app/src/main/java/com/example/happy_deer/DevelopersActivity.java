package com.example.happy_deer;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

public class DevelopersActivity extends AppCompatActivity {

    private SimpleHttpServer server;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_developers);
        TextView logTextView = findViewById(R.id.logTextView);

        logAllThreads(logTextView);
//        获取按钮
        TextView DelDateBase = findViewById(R.id.DelDateBase);
        EditText inputText = findViewById(R.id.inputText);
        TextView delDateById_btn = findViewById(R.id.delDateById);
        TextView selectDateBase = findViewById(R.id.selectDateBase);
        TextView delAllFile = findViewById(R.id.delAllFile);
        TextView SelectFilesAllDate = findViewById(R.id.SelectFilesAllDate);
        TextView GetUpdateApp = findViewById(R.id.GetUpdateApp);
        TextView startServer = findViewById(R.id.startServer);
        TextView closeServer = findViewById(R.id.closeServer);
        TextView addTextDate = findViewById(R.id.addTextDate);

        closeServer.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (server != null) {
                    server.stop(); // 停止服务器
                    Log.e("DevelopersActivity","Server已关闭");
                }
            }
        });

        startServer.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    server = new SimpleHttpServer(8080); // 使用8080端口
                    server.start();
                    Log.e("DevelopersActivity","Server已启动");
                    String localIpAddress = getLocalIpAddress(DevelopersActivity.this);
                    System.out.println("Local IP Address: " + localIpAddress);
                    logTextView.setText("Server已启动，在模拟器上通过localhost:8080访问成功，真机测试:" + localIpAddress + ":8080");
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }
        });

        DelDateBase.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
//                删除数据库
                boolean isDeleted = DevelopersActivity.this.deleteDatabase("HealthRecords.db");
                // 检查是否删除成功
                if (isDeleted) {
                    Log.d("Database", "Database deleted successfully");
                } else {
                    Log.d("Database", "Failed to delete database");
                }
            }
        });

        delDateById_btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
//                获取input Text
                String text = inputText.getText().toString();
                if (TextUtils.isEmpty(text)){
//                    文本为空
                    inputText.setText("请输入ID以进行删除操作");
                }else {
//                    文本不为空
                    try {
                        int id = Integer.parseInt(text);
                        // 进一步处理删除记录的逻辑
                        deleteRecordById(id);
                    } catch (NumberFormatException e) {
                        // 输入的文本不是有效的整数
                        inputText.setText("请输入有效的数字作为ID");
                    }
                }
            }
        });

        selectDateBase.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
//                查询
                displayAllRecords(logTextView);

            }
        });

        delAllFile.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                deleteAllFilesInInternalStorage();
            }
        });

        SelectFilesAllDate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                List<String> files = listAllFilesInInternalStorage();
                StringBuilder fileLog = new StringBuilder(); // 使用 StringBuilder 来构建文件列表
                // 遍历文件名列表
                for (String fileName : files) {
                    Log.d("File", fileName); // 打印文件名
                    fileLog.append(fileName).append("\n"); // 将文件名添加到 StringBuilder，并换行
                }
                //打印到TextView
                logTextView.setText(fileLog.toString());
                // 显示文件数量
                Toast.makeText(DevelopersActivity.this, "Total files: " + files.size(), Toast.LENGTH_SHORT).show();
            }
        });

        GetUpdateApp.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                UpdateApp.fetchJsonData(new UpdateApp.VersionCallback() {
                    @Override
                    public void onVersionFetched(String version,String downloadUrl) {

                    }
                });
            }
        });

//        增加测试数据
        addTextDate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                DBOpenHelper dbOpenHelper = new DBOpenHelper(DevelopersActivity.this, "HealthRecords.db", null, 1);
                SQLiteDatabase db = dbOpenHelper.getWritableDatabase();
                insertRandomData(db);
                db.close();
            }
        });

    }

    private void logAllThreads(TextView textView) {
        // 创建一个 StringBuilder 用于收集线程信息
        StringBuilder result = new StringBuilder();

        // 获取所有线程及其堆栈跟踪信息
        Map<Thread, StackTraceElement[]> allStackTraces = Thread.getAllStackTraces();

        for (Map.Entry<Thread, StackTraceElement[]> entry : allStackTraces.entrySet()) {
            Thread thread = entry.getKey();
            StackTraceElement[] stackTraceElements = entry.getValue();

            result.append("Thread Name: ").append(thread.getName()).append("\n");
            result.append("Thread State: ").append(thread.getState()).append("\n");

            for (StackTraceElement element : stackTraceElements) {
                result.append("  at ").append(element.toString()).append("\n");
            }
            result.append("\n"); // 为每个线程之间添加空行
        }

        // 将结果设置到 TextView
        textView.setText(result.toString());
    }

//    通过ID删除对应数据
    public void deleteRecordById(int id) {
        // 创建数据库
        DBOpenHelper dbOpenHelper = new DBOpenHelper(DevelopersActivity.this, "HealthRecords.db", null, 1);
        SQLiteDatabase db = dbOpenHelper.getWritableDatabase();

        // 定义删除条件，使用问号占位符
        String whereClause = "id = ?";
        String[] whereArgs = new String[]{String.valueOf(id)};

        // 执行删除操作
        int rowsDeleted = db.delete("HealthRecords", whereClause, whereArgs);

        // 检查删除结果
        if (rowsDeleted > 0) {
            Log.d("Database", "Record with ID " + id + " deleted successfully");
        } else {
            Log.d("Database", "No record found with ID " + id);
        }

        // 关闭数据库
        db.close();
    }

//    显示所有数据
public void displayAllRecords(TextView textView) {
    // 创建DBOpenHelper实例
    DBOpenHelper dbOpenHelper = new DBOpenHelper(DevelopersActivity.this, "HealthRecords.db", null, 1);

    // 获取可写数据库
    SQLiteDatabase db = dbOpenHelper.getWritableDatabase();

    // 查询所有记录
    Cursor healthRecords = db.query("HealthRecords",
            new String[]{"ID", "Date", "Time", "Frequency", "Last_datetime", "Interval_time", "Remarks"},
            null, null, null, null, null);

    StringBuilder result = new StringBuilder(); // 用于存储查询结果

    // 遍历Cursor对象，获取每一行的数据
    while (healthRecords.moveToNext()) {
        int id = healthRecords.getInt(0);
        String date = healthRecords.getString(1);
        String time = healthRecords.getString(2);
        String frequency = healthRecords.getString(3);
        String lastDatetime = healthRecords.getString(4);
        String intervalTime = healthRecords.getString(5);
        String remarks = healthRecords.getString(6);

        // 将结果格式化并添加到StringBuilder中
        result.append("ID: ").append(id)
                .append(", Date: ").append(date)
                .append(", Time: ").append(time)
                .append(", Frequency: ").append(frequency)
                .append(", Last Datetime: ").append(lastDatetime)
                .append(", Interval Time: ").append(intervalTime)
                .append(", Remarks: ").append(remarks)
                .append("\n");
    }

    // 关闭Cursor和数据库
    healthRecords.close();
    db.close();

    // 将结果设置给TextView
    textView.setText(result.toString());
}

    public void deleteAllFilesInInternalStorage() {
        // 获取内部存储的 files 目录
        File directory = getFilesDir();

        // 检查目录是否存在且是一个目录
        if (directory.exists() && directory.isDirectory()) {
            // 获取目录下所有文件
            File[] files = directory.listFiles();

            if (files != null) {
                for (File file : files) {
                    // 如果是文件，则删除
                    if (file.isFile()) {
                        boolean deleted = file.delete();
                        if (deleted) {
                            Log.d("Delete File", file.getName() + " deleted successfully.");
                        } else {
                            Log.d("Delete File", "Failed to delete " + file.getName());
                        }
                    }
                }
            }
        }
    }

    public List<String> listAllFilesInInternalStorage() {
        List<String> fileList = new ArrayList<>();

        // 获取内部存储的 files 目录
        File directory = getFilesDir();

        // 检查目录是否存在且是一个目录
        if (directory.exists() && directory.isDirectory()) {
            // 获取目录下所有文件
            File[] files = directory.listFiles();

            if (files != null) {
                for (File file : files) {
                    // 将文件名添加到列表中
                    fileList.add(file.getName());
                }
            }
        }

        return fileList; // 返回包含所有文件名的列表
    }

    public static String getLocalIpAddress(Context context) {
        try {
            // 获取 WifiManager
            WifiManager wifiManager = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
            WifiInfo wifiInfo = wifiManager.getConnectionInfo();

            // 获取 IP 地址，返回值为 int 型，需要转换为字符串
            int ipAddress = wifiInfo.getIpAddress();
            return String.format("%d.%d.%d.%d",
                    (ipAddress & 0xff),
                    (ipAddress >> 8 & 0xff),
                    (ipAddress >> 16 & 0xff),
                    (ipAddress >> 24 & 0xff));
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public void insertRandomData(SQLiteDatabase db) {
        Random random = new Random();
        Calendar calendar = Calendar.getInstance();

        // 每个月的日期范围
        int year = 2024; // 可以根据需要设置年份
        int totalRecords = 100; // 总共希望生成的记录数

        for (int month = 0; month < 12; month++) {
            // 为每个月随机生成记录数量，确保所有月份的总记录数为100左右
            int recordsForMonth = random.nextInt(Math.max(1, totalRecords / (12 - month))) + 1; // 每个至少一条，动态调整剩余可用记录数

            for (int i = 0; i < recordsForMonth; i++) {
                // 随机生成一个日期（每个月至少一条记录）
                int day = random.nextInt(28) + 1; // 生成1到28之间的随机数，避免超出月份范围
                calendar.set(year, month, day);

                // 随机生成时间
                int hour = random.nextInt(24); // 0-23
                int minute = random.nextInt(60); // 0-59

                // 随机生成其他字段
                int frequency = random.nextInt(10) + 1; // 频率1到10
                long lastDatetime = calendar.getTimeInMillis(); // 当前日期时间戳
                int intervalTime = random.nextInt(60) + 1; // 间隔时间1到60分钟
                String remarks = "测试记录 " + (month + 1) + "-" + (day); // 备注

                // 创建ContentValues对象
                ContentValues values = new ContentValues();
                // 格式化日期
                String formattedDate = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(calendar.getTime());
                values.put("Date", formattedDate); // 将日期存储为格式化的字符串
                values.put("Time", String.format("%02d:%02d:00", hour, minute)); // 格式化时间
                values.put("Frequency", frequency);
                values.put("Last_datetime", lastDatetime);
                values.put("Interval_time", intervalTime);
                values.put("Remarks", remarks);

                // 插入数据
                db.insert("HealthRecords", null, values);
            }

            // 更新剩余记录数
            totalRecords -= recordsForMonth;
        }
    }



}
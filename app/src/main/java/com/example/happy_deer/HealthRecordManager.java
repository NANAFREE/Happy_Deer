package com.example.happy_deer;


import android.annotation.SuppressLint;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;
import android.os.Environment;
import android.util.Log;
import android.widget.Toast;

import com.github.mikephil.charting.data.Entry;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class HealthRecordManager {
    private DBOpenHelper dbOpenHelper;

    // 构造函数
    public HealthRecordManager(Context context) {
        // 初始化 DBOpenHelper
        dbOpenHelper = new DBOpenHelper(context, "HealthRecords.db", null, 1);
    }


    //    根据年份月份查询所有数据
    public List<String> getRecordsForMonth(int year, int month) {
        List<String> records = new ArrayList<>();
        SQLiteDatabase db = dbOpenHelper.getReadableDatabase();

        // 格式化年份和月份以便于在SQL中使用
        String yearStr = String.valueOf(year);
        String monthStr = String.format("%02d", month); // 确保两位数格式，例如01, 02等

        // 查询语句
        String query = "SELECT * FROM HealthRecords WHERE Date LIKE ?";

        // 生成查询参数，确保年份和月份被格式化
        String[] selectionArgs = { yearStr + "-" + monthStr + "%" };

        Cursor cursor = db.rawQuery(query, selectionArgs);

        if (cursor.moveToFirst()) {
            do {
                // 根据列索引获取数据，这里假设你只想要Date和Remarks列
                @SuppressLint("Range") String date = cursor.getString(cursor.getColumnIndex("Date"));
                @SuppressLint("Range") String remarks = cursor.getString(cursor.getColumnIndex("Remarks"));

                records.add("Date: " + date + ", Remarks: " + remarks);
            } while (cursor.moveToNext());
        }

        cursor.close();
        db.close();
        return records;
    }

//    根据年份月份查询当前数据的数量
public int getRecordCountForMonth(int year, int month) {
    int count = 0;
    SQLiteDatabase db = dbOpenHelper.getReadableDatabase();

    // 格式化年份和月份以便于在SQL中使用
    String yearStr = String.valueOf(year);
    String monthStr = String.format("%02d", month); // 确保两位数格式，例如01, 02等

    // 查询语句，使用 COUNT 来获取记录数量
    String query = "SELECT COUNT(*) FROM HealthRecords WHERE Date LIKE ?";

    // 生成查询参数
    String[] selectionArgs = { yearStr + "-" + monthStr + "%" };

    Cursor cursor = db.rawQuery(query, selectionArgs);

    if (cursor.moveToFirst()) {
        // 获取 COUNT 的结果
        count = cursor.getInt(0); // 第一列是 COUNT(*)
    }

    cursor.close();
    db.close();
    return count;
}

    // 根据年份、月份和日期查询当前数据的数量
    public int getRecordCountForDate(String date) {
        int count = 0;
        SQLiteDatabase db = dbOpenHelper.getReadableDatabase();

        // 查询语句，使用 COUNT 来获取记录数量
        String query = "SELECT COUNT(*) FROM HealthRecords WHERE Date = ?";
        String[] selectionArgs = new String[]{date}; // 将 date 放入数组中
        Cursor cursor = db.rawQuery(query, selectionArgs);

        if (cursor.moveToFirst()) {
            // 获取 COUNT 的结果
            count = cursor.getInt(0); // 第一列是 COUNT(*)
        }

        cursor.close();
        db.close();
        Log.i("HealthRecordManager","数据数量:" + count);
        return count;
    }

    public String getCurrentDateFormatted() {
        // 获取当前日期和时间
        Date currentDate = new Date();

        // 定义日期格式
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());

        // 格式化当前日期
        return dateFormat.format(currentDate);
    }

    public int[] getCurrentDateArray() {
        // 获取当前格式化日期
        String currentDateFormatted = getCurrentDateFormatted();

        // 解析日期字符串，假设格式为 yyyy-MM-dd
        String[] dateParts = currentDateFormatted.split("-");

        // 创建一个整数数组以存储年、月、日
        int[] dateArray = new int[3];

        // 将解析的年、月、日转换为整数并存储到数组中
        dateArray[0] = Integer.parseInt(dateParts[0]); // 年
        dateArray[1] = Integer.parseInt(dateParts[1]); // 月
        dateArray[2] = Integer.parseInt(dateParts[2]); // 日

        return dateArray; // 返回包含年、月、日的数组
    }


    // 方法：根据输入的日期字符串返回星期几
    public String getDayOfWeek(String dateString) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        try {
            // 解析输入的日期字符串
            Date date = sdf.parse(dateString);
            Calendar calendar = Calendar.getInstance();
            calendar.setTime(date);

            int dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK);
            String day;

            switch (dayOfWeek) {
                case Calendar.SUNDAY:
                    day = "星期日";
                    break;
                case Calendar.MONDAY:
                    day = "星期一";
                    break;
                case Calendar.TUESDAY:
                    day = "星期二";
                    break;
                case Calendar.WEDNESDAY:
                    day = "星期三";
                    break;
                case Calendar.THURSDAY:
                    day = "星期四";
                    break;
                case Calendar.FRIDAY:
                    day = "星期五";
                    break;
                case Calendar.SATURDAY:
                    day = "星期六";
                    break;
                default:
                    day = "";
                    break;
            }

            return day;
        } catch (Exception e) {
            e.printStackTrace();
            return "无效日期"; // 返回无效日期提示
        }
    }



    public ArrayList<Entry> getDataFromDatabase(int year, int month) {
        ArrayList<Entry> entries = new ArrayList<>();
        SQLiteDatabase db = dbOpenHelper.getReadableDatabase(); // 使用 dbOpenHelper 获取数据库实例

        // 将月份转换为符合 SQLite 格式的字符串（例如：'2024-09-01'）
        String startDate = year + "-" + String.format("%02d", month) + "-01";
        String endDate = year + "-" + String.format("%02d", month) + "-" +
                Calendar.getInstance().getActualMaximum(Calendar.DAY_OF_MONTH);

        // 更新查询，使用 DATE 函数提取 Day
        String query = "SELECT strftime('%d', Date) AS Day, Time FROM HealthRecords WHERE Date BETWEEN ? AND ?";
        Cursor cursor = null;

        try {
            cursor = db.rawQuery(query, new String[]{startDate, endDate});

            while (cursor.moveToNext()) {
                @SuppressLint("Range") int day = cursor.getInt(cursor.getColumnIndex("Day")); // 从查询结果中获取 Day
                @SuppressLint("Range") String time = cursor.getString(cursor.getColumnIndex("Time"));

                // 将时间字符串转换为分钟数，计算 y 值
                String[] timeParts = time.split(":"); // 假设时间格式为 HH:mm:ss
                if (timeParts.length >= 2) { // 确保有足够的部分
                    int hour = Integer.parseInt(timeParts[0]);
                    int minute = Integer.parseInt(timeParts[1]);
                    float yValue = hour * 60 + minute; // 转换为分钟

                    // 添加数据点
                    entries.add(new Entry(day, yValue));
                } else {
                    // 处理时间格式不正确的情况
                    Log.e("DatabaseError", "时间格式不正确: " + time);
                }
            }
        } catch (Exception e) {
            Log.e("DatabaseError", "查询数据时出错: " + e.getMessage());
        } finally {
            if (cursor != null) {
                cursor.close(); // 关闭 Cursor
            }
            db.close(); // 关闭数据库连接
        }

        return entries;
    }


    //    获取20个数据内的平均时间
    public String getAverageIntervalTime() {
        String result = "";

        SQLiteDatabase db = dbOpenHelper.getReadableDatabase();
        // 查询最近的20个记录的 Interval_time
        String query = "SELECT Interval_time FROM HealthRecords ORDER BY Last_datetime DESC LIMIT 20";
        Cursor cursor = db.rawQuery(query, null);

        int totalMinutes = 0;
        int count = 0;

        if (cursor.moveToFirst()) {
            do {
                @SuppressLint("Range") int intervalTime = cursor.getInt(cursor.getColumnIndex("Interval_time"));
                totalMinutes += intervalTime;
                count++;
            } while (cursor.moveToNext());
        }

        cursor.close();

        if (count > 0) {
            // 计算平均时间
            int averageMinutes = totalMinutes / count;

            // 转换为小时和分钟
            int hours = averageMinutes / 60;
            int minutes = averageMinutes % 60;

            if (hours > 0) {
                result = String.format("%d小时%d分钟", hours, minutes);
            } else {
                result = String.format("%d分钟", minutes);
            }
        }

        return result;
    }

    public void exportDatabaseToCSV() {
        SQLiteDatabase db = dbOpenHelper.getReadableDatabase();
        Cursor cursor = db.rawQuery("SELECT * FROM HealthRecords", null);

        StringBuilder csvData = new StringBuilder();

        // 获取列名
        for (int i = 0; i < cursor.getColumnCount(); i++) {
            csvData.append(cursor.getColumnName(i)).append(",");
        }
        csvData.setLength(csvData.length() - 1); // 移除最后一个逗号
        csvData.append("\n");

        // 获取数据并构建CSV内容
        while (cursor.moveToNext()) {
            for (int i = 0; i < cursor.getColumnCount(); i++) {
                csvData.append(cursor.getString(i)).append(",");
            }
            csvData.setLength(csvData.length() - 1); // 移除最后一个逗号
            csvData.append("\n");
        }

        cursor.close();
        db.close();

        // 将CSV内容写入文件
        try {
            // 在 Downloads 目录下创建 MyApp 子文件夹
            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            File appFolder = new File(downloadsDir, "Happy_deer");

            // 确保文件夹存在
            if (!appFolder.exists()) {
                appFolder.mkdirs();
            }

            // 创建 HealthRecords.csv 文件
            File file = new File(appFolder, "HealthRecords.csv");

            FileOutputStream fos = new FileOutputStream(file);
            fos.write(csvData.toString().getBytes());
            fos.close();
            Log.d("HealthRecordManager","导出成功: " + file.getAbsolutePath());
        } catch (IOException e) {
            e.printStackTrace();
            Log.d("HealthRecordManager","导出失败");

        }
    }

//    数据导出 我觉得用上面的比较好，之前没看懂，现在看懂了，因为上面会将文件保存在Download的自建文件夹APP里
    public void exportData(Context context) {
        SQLiteDatabase db = dbOpenHelper.getReadableDatabase();
        Cursor cursor = db.rawQuery("SELECT * FROM HealthRecords", null);

        // 指定导出文件的路径和名称
        File exportDir = new File(context.getExternalFilesDir(null), "export");
        if (!exportDir.exists()) {
            exportDir.mkdirs(); // 创建目录
        }

        File exportFile = new File(exportDir, "health_records.csv");

        try {
            FileWriter fileWriter = new FileWriter(exportFile);
            StringBuilder sb = new StringBuilder();

            // 添加表头
            sb.append("ID,Date,Time,Frequency,Last_datetime,Interval_time,Remarks\n");

            while (cursor.moveToNext()) {
                sb.append(cursor.getInt(0)).append(",") // ID
                        .append(cursor.getString(1)).append(",") // Date
                        .append(cursor.getString(2)).append(",") // Time
                        .append(cursor.getInt(3)).append(",") // Frequency
                        .append(cursor.getString(4)).append(",") // Last_datetime
                        .append(cursor.getInt(5)).append(",") // Interval_time
                        .append(cursor.getString(6)).append("\n"); // Remarks
            }

            fileWriter.write(sb.toString());
            fileWriter.close();
            cursor.close();
            Toast.makeText(context, "Export Successful: " + exportFile.getAbsolutePath(), Toast.LENGTH_LONG).show();
        } catch (IOException e) {
            e.printStackTrace();
            Toast.makeText(context, "Export Failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    //数据导入
    public void importData(Context context, Uri uri) {
        SQLiteDatabase db = dbOpenHelper.getReadableDatabase();
        BufferedReader bufferedReader;

        try {
            InputStream inputStream = context.getContentResolver().openInputStream(uri);
            bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
            String line;

            // 跳过表头
            bufferedReader.readLine();

            while ((line = bufferedReader.readLine()) != null) {
                String[] values = line.split(",");
                ContentValues contentValues = new ContentValues();
                contentValues.put("Date", values[1]);
                contentValues.put("Time", values[2]);
                contentValues.put("Frequency", Integer.parseInt(values[3]));
                contentValues.put("Last_datetime", values[4]);
                contentValues.put("Interval_time", Integer.parseInt(values[5]));
                contentValues.put("Remarks", values[6]);

                db.insert("HealthRecords", null, contentValues);
            }

            bufferedReader.close();
            Toast.makeText(context, "Import Successful", Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(context, "Import Failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }





}

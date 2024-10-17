package com.example.happy_deer;

import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

public class DataExporitActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_data_exporit);

        TextView exportData = findViewById(R.id.ExportData);
        TextView importData = findViewById(R.id.ImportData);

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

            }
        });

    }
}
## 🔧 1. **Chức năng chính (Core Functions)**

### 🎯 Chủ đề chính: **Robot Navigation**

Giải bài toán tìm đường trong mê cung, mở rộng với nhiều yêu cầu AI khác nhau.

#### 🧠 1.1. Các Function chính

|Tên Function|Mô tả|Thuật toán áp dụng|
|---|---|---|
|**Blind Robot**|Robot chỉ thấy được 1 vùng phía trước, tìm đường đi A -> B|DFS, BFS, A*, Dijkstra|
|**Robot quét nhà**|Tìm đường đi từ A -> thăm hết các ô bẩn -> về B|TSP + A*/Dijkstra (Greedy Approximation)|
|**Mê cung có trọng số**|Tìm đường đi ngắn nhất từ A đến B trong mê cung có trọng số|Dijkstra, A*|
|**Tự chọn**|Có thể cho thêm chức năng như dynamic obstacle, moving goal,...|(Tùy biến thêm sau)|

---

## 🧩 2. **UI/UX (Front-end với React)**

### 2.1. Maze Visualizer

- Vẽ mê cung dạng lưới (grid) có thể tương tác (click chuột để thêm tường, robot, đích, các ô bẩn,...)
    
- **Chế độ hiển thị:**
    
    - Realtime: Hiển thị từng bước đi của robot
        
    - Instant: Tính xong rồi mô phỏng lại đường đi
        
- **Input:**
    
    - File JSON hoặc tạo mê cung thủ công
        
- **Output:**
    
    - Hành trình, số bước, thời gian chạy,...
        

### 2.2. Algorithm Control Panel

- **Chọn thuật toán:** BFS, DFS, UCS, A*, IDA*, ...
    
- **Heuristic cho A***:
    
    - Chọn giữa Euclidean, Manhattan
        
    - Optional: Người dùng có thể nhập JS code để tạo heuristic riêng
        

### 2.3. Điều khiển lệnh

- **Chế độ chạy:**
    
    - Gửi toàn bộ lệnh 1 lần
        
    - Gửi từng bước (step-by-step, có thể dùng slider)
        

---

## 🛠️ 3. **Back-end (C++ hoặc Node server)**

### 3.1. Server xử lý thuật toán

- Nhận input từ front-end, tính toán kết quả (nếu cần tối ưu hiệu năng thì dùng C++)
    
- Trả về chuỗi di chuyển, thời gian, cost...
    

### 3.2. Leaderboard

- Cho phép người dùng submit thuật toán hoặc heuristic
    
- Hiển thị ai tìm ra lời giải tốt nhất (dựa trên cost, time,...)
    

---

## 🏗️ 4. **Kiến trúc tổng quan**

```
[React Frontend] 
  └─ UI Maze + Algorithm Control
        ↓ 
[API Call]
  └─ NodeJS Backend (hoặc gọi C++ executable)
        ↓
[Thuật toán xử lý]
        ↓
[Output path, stats] → Trả về front-end → Visualize
```

---

## 📆 5. **Timeline đề xuất (4 tuần)**

|Tuần|Công việc chính|
|---|---|
|**Tuần 1**|- Thiết kế giao diện cơ bản (React)- Tạo Maze Editor (gán ô tường, start, end)- Chuẩn bị thuật toán cơ bản (BFS, DFS)|
|**Tuần 2**|- Thêm A*, Dijkstra, visualizer- Thêm input tùy chỉnh (graph JSON)- Làm chế độ realtime / instant|
|**Tuần 3**|- Tích hợp backend xử lý thuật toán- Làm chức năng quét nhà + blind robot- Tối ưu hiệu suất (giảm lag, debounce update)|
|**Tuần 4**|- Hoàn thiện UI/UX- Cho người dùng viết heuristic- Làm Leaderboard + thử nghiệm- Viết báo cáo & chuẩn bị thuyết trình|

---

## 🔗 6. **Công nghệ đề xuất**

|Phần|Công nghệ|
|---|---|
|Frontend|React + TailwindCSS|
|Backend|NodeJS|
|Xử lý thuật toán|C++ hoặc JS (nếu nhẹ)|
|Visualize|Canvas |
|Data format|JSON cho input/output graph|
|Hosting|Vercel (FE), Render / Railway / Local (BE)|

---

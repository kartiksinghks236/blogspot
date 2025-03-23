<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// डेटाबेस कनेक्शन
$host = 'localhost';
$dbname = 'blog_spot';
$username = 'root'; // अपना यूजरनेम डालें
$password = ''; // अपना पासवर्ड डालें

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// एक्शन प्राप्त करें
$action = $_GET['action'] ?? '';

// पोस्ट बनाएं
if ($action === 'createPost') {
    $title = $_POST['title'] ?? '';
    $content = $_POST['content'] ?? '';
    $tags = $_POST['tags'] ?? '[]';
    $featured_image = $_FILES['featured_image']['name'] ?? '';

    if (empty($title) || empty($content)) {
        echo json_encode(['status' => 'error', 'message' => 'Title and content are required']);
        exit;
    }

    // फ़ाइल अपलोड हैंडल करें
    if (!empty($featured_image)) {
        $target_dir = "uploads/";
        if (!is_dir($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        $target_file = $target_dir . basename($_FILES['featured_image']['name']);
        move_uploaded_file($_FILES['featured_image']['tmp_name'], $target_file);
    }

    // डेटाबेस में पोस्ट डालें
    $stmt = $conn->prepare("INSERT INTO posts (title, content, featured_image, tags) VALUES (:title, :content, :featured_image, :tags)");
    $stmt->execute([
        ':title' => $title,
        ':content' => $content,
        ':featured_image' => $featured_image,
        ':tags' => $tags
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Post created successfully']);
}

// सभी पोस्ट प्राप्त करें
elseif ($action === 'getPosts') {
    $stmt = $conn->query("SELECT * FROM posts ORDER BY created_at DESC");
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success', 'data' => $posts]);
}

// पोस्ट अपडेट करें
elseif ($action === 'updatePost') {
    $id = $_POST['id'] ?? '';
    $title = $_POST['title'] ?? '';
    $content = $_POST['content'] ?? '';
    $tags = $_POST['tags'] ?? '[]';

    if (empty($id) || empty($title) || empty($content)) {
        echo json_encode(['status' => 'error', 'message' => 'ID, title, and content are required']);
        exit;
    }

    $stmt = $conn->prepare("UPDATE posts SET title = :title, content = :content, tags = :tags WHERE id = :id");
    $stmt->execute([
        ':id' => $id,
        ':title' => $title,
        ':content' => $content,
        ':tags' => $tags
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Post updated successfully']);
}

// पोस्ट डिलीट करें
elseif ($action === 'deletePost') {
    $id = $_GET['id'] ?? '';

    if (empty($id)) {
        echo json_encode(['status' => 'error', 'message' => 'Post ID is required']);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM posts WHERE id = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode(['status' => 'success', 'message' => 'Post deleted successfully']);
}

// फ़ाइल अपलोड करें
elseif ($action === 'upload') {
    if (isset($_FILES['file'])) {
        $target_dir = "uploads/";
        if (!is_dir($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        $target_file = $target_dir . basename($_FILES['file']['name']);
        move_uploaded_file($_FILES['file']['tmp_name'], $target_file);
        echo json_encode(['status' => 'success', 'location' => $target_file]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No file uploaded']);
    }
}

// अमान्य एक्शन
else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}
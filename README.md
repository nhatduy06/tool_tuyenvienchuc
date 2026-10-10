# Vienchuc247 Notice Collector

Tool Node.js/TypeScript độc lập để đọc RSS tuyển dụng, lọc thông báo liên quan đến giáo dục và ghi metadata vào bảng Supabase `recruitment_notices`. Tool không lưu toàn bộ nội dung bài viết và không có frontend.

## Chạy local

1. Cài Node.js 20 hoặc mới hơn.
2. Cài dependency: `npm install`.
3. Tạo `.env` từ `.env.example`, điền `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` khi cần ghi dữ liệu.
4. Chạy migration `supabase/migrations/001_create_recruitment_notices.sql` trong Supabase SQL Editor hoặc Supabase CLI.
5. Chạy thử không ghi database: `npm run collect:dry`.
6. Chạy collector thật: `npm run collect`.

`RSS_FEED_URL` mặc định là `https://tuyencongchuc.vn/feed/`. Có thể thay `NOTICE_KEYWORDS` bằng danh sách keyword phân cách bởi dấu phẩy. Mỗi request có User-Agent, timeout 15 giây, tối đa 2 lần retry và kiểm tra robots.txt trước khi tải trang chi tiết.

Nếu RSS bị trang gốc chặn truy cập tự động (HTTP 403), tool tự động dùng WordPress REST API (`/wp-json/wp/v2/posts`) của cùng trang làm dự phòng. Cả hai nguồn đều chỉ lấy metadata (tiêu đề, link, mô tả ngắn, ngày đăng), không sao chép toàn bộ nội dung. Nếu cả hai đều lỗi, workflow báo lỗi và dữ liệu cũ trong Supabase được giữ nguyên.

## GitHub Actions

1. Tạo GitHub repository riêng cho project này, không dùng repository website chính.
2. Thêm repository secrets `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`.
3. Push code và bật GitHub Actions.
4. Workflow chạy thủ công bằng `workflow_dispatch` hoặc tự động mỗi 12 giờ.
5. Kiểm tra dữ liệu trong bảng `recruitment_notices`.

Không commit `.env`, service role key hoặc secret nào vào GitHub. Nếu RSS lỗi, job thất bại và không thực hiện ghi, nên dữ liệu cũ không bị xóa.

## Tuân thủ ghi nguồn

Nguồn RSS `https://tuyencongchuc.vn/feed/` yêu cầu ghi rõ nguồn `www.tuyencongchuc.vn` khi phát hành lại thông tin.

Tool lưu đúng `source_name = 'www.tuyencongchuc.vn'` cho mọi bản ghi và chỉ lưu metadata + link, không sao chép toàn bộ nội dung bài viết.

Website chính khi hiển thị dữ liệu từ bảng `recruitment_notices` phải ghi nguồn, ví dụ:

```tsx
<p>
  Nguồn: <a href={notice.aggregator_url} target="_blank" rel="noreferrer">www.tuyencongchuc.vn</a>
</p>
```

## Kiểm thử và build

- `npm test`: chạy Vitest.
- `npm run typecheck`: kiểm tra TypeScript.
- `npm run build`: tạo JavaScript trong `dist`.

## Mở rộng nguồn RSS

Thêm URL vào cấu hình hoặc tạo một reader mới trả về cùng kiểu `FeedNotice` trong `src/types.ts`, sau đó gọi reader đó từ `src/collector.ts`. Giữ `source_name` riêng cho từng nguồn và vẫn dùng `aggregator_url` làm khóa chống trùng.

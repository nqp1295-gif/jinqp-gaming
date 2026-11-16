# Khảo sát Playhop và ma trận phạm vi

Khảo sát ngày 13/11/2026. Ký hiệu: **UI** = quan sát giao diện khách; **DOC** = tài liệu công khai; **ĐX** = đề xuất cho dự án; **CX** = chưa kiểm chứng. Không có đăng nhập tài khoản, giao dịch trả tiền hoặc quyền quản trị trong đợt khảo sát.

## Bằng chứng và giới hạn

| Nguồn | Nội dung sử dụng |
| --- | --- |
| [Trang chủ tiếng Việt](https://playhop.com/vi) | Danh mục, game đề xuất, thẻ game, tìm kiếm, đăng nhập, số dư, thông báo. |
| [Hộp thoại mua hop](https://playhop.com/vi?balance-refill-flow=purchase) | Mở trực tiếp bằng nút số dư; gói nạp, giá, email biên nhận và nhãn XSolla. |
| [Game KHỐI8](https://playhop.com/vi/app/khoi8-98993) | Player, toàn màn hình, menu, thông tin, đánh giá, nhà phát triển, thẻ và game tương tự. |
| [FAQ](https://playhop.com/faq) | Chơi trên trình duyệt, tài khoản, quảng cáo, gợi ý và lưu tiến trình. |
| [Điều khoản](https://playhop.com/termsofuse) | HTML5, dữ liệu hoạt động, review/leaderboard và gợi ý theo hành vi. |
| [License](https://playhop.com/license) | Balance gắn tài khoản, portal currency và mua nội dung; khoản 1.10 mô tả tiền nội bộ không quy đổi ngược thành tiền mặt. |
| [Nhà phát triển](https://playhop.com/developers) | Hệ sinh thái phát hành HTML5/WebGL và monetization. |
| [Đối tác publisher](https://playhop.com/publishers/) | Chương trình nhúng game/affiliate theo thỏa thuận đối tác. |
| [Blog](https://playhop.com/blog) | Nội dung hướng dẫn và biên tập. |

## Ma trận triển khai

| ID | Chức năng | Bằng chứng | Định hướng |
| --- | --- | --- | --- |
| F01 | Trang chủ game đề xuất dạng lưới | UI | M2; cấu hình hàng/bộ sưu tập từ admin. |
| F02 | Game mới, phổ biến và danh mục | UI | M2; nhiều thể loại và thẻ. |
| F03 | Tìm game/thể loại | UI | M2; đã mở ô tìm và trang kết quả `search?query=puzzle`; chất lượng gợi ý chưa xác minh. |
| F04 | Điểm xếp hạng trên thẻ game | UI | M2; định nghĩa công thức của dự án riêng; không suy đoán thuật toán Playhop. |
| F05 | Nhãn độ tuổi, mới, hàng đầu | UI | M2; rule và kiểm duyệt admin. |
| F06 | Trình chơi HTML5/WebGL | UI + DOC | M2; sandbox, origin riêng, trạng thái lỗi. |
| F07 | Chế độ toàn màn hình | UI | M2; hỗ trợ theo trình duyệt. |
| F08 | Trang/hộp thông tin game | UI | M2; mô tả, ảnh/video, cách chơi. |
| F09 | Hồ sơ nhà phát triển và game liên quan | UI | M2 cho trang hiển thị; M7 cho tự phục vụ. |
| F10 | Thông tin ngôn ngữ, thiết bị, ngày phát hành | UI | M2; theo từng game version. |
| F11 | Đăng nhập, nhắc lưu thành tích/tiến trình | UI + DOC | M1/M2; tùy SDK, không mặc định mọi game có cloud save. |
| F12 | Đánh giá người chơi và leaderboard | UI + DOC | M2; xác minh game có hỗ trợ; chống spam. |
| F13 | Tổng hợp nhận xét bằng AI | UI ở KHỐI8 | M7 tùy chọn; không nằm trong lõi tiền; cần chốt tích hợp và chi phí riêng. |
| F14 | Chia sẻ, báo lỗi, cách chơi | UI | M2. |
| F15 | Tắt quảng cáo | UI có nút | M3; điều kiện/giá và thời hạn chưa xác minh. |
| F16 | Kích hoạt mã | UI trong menu | M3; nội dung quyền lợi chưa xác minh. |
| F17 | Thêm lối tắt màn hình nền | UI trong menu | M2; phụ thuộc trình duyệt/OS. |
| F18 | Thông báo | UI có nút | M2; nội dung sau đăng nhập chưa kiểm tra. |
| F19 | Hiển thị số dư hop | UI | M3; tách khỏi số dư tiền thật theo loại. |
| F20 | Mua gói hop | UI | M3; luồng sandbox trước. |
| F21 | Nhập số lượng hop khác | UI | M3; bật bằng cấu hình, báo giá server. |
| F22 | Email nhận biên nhận, chuyển thanh toán | UI | M3; không nhập email hay thực hiện giao dịch trong khảo sát. |
| F23 | Chơi gần đây/yêu thích | ĐX/CX | M2; hữu ích cho trải nghiệm tương đương, chưa thấy trong phiên khách khảo sát. |
| F24 | Quảng cáo nền tảng | UI + DOC | M3/M7; rewarded ads cần SDK và xác minh nếu có thưởng nội bộ. |
| F25 | Gợi ý cá nhân hóa nâng cao | DOC; thuật toán CX | M7; bắt đầu bằng phổ biến/theo thể loại, đo hiệu quả trước ML. |
| F26 | Blog/FAQ/pháp lý/hỗ trợ | DOC + UI | M2; CMS và nội dung do dự án duyệt. |
| F27 | Cổng gửi game của developer | DOC; quy trình nội bộ CX | M7; khởi đầu admin nhập game và kiểm duyệt. |
| F28 | Affiliate/publisher | DOC | M7; hợp đồng và attribution riêng. |
| F29 | Admin CMS, RBAC, audit, đối soát | ĐX; Playhop admin CX | M1–M6; thiết kế theo vận hành dự án. |
| F30 | Chuyển số dư giữa người dùng | Yêu cầu riêng, Playhop CX | M5; tùy nguồn tiền/thị trường/đối tác. |
| F31 | Rút tiền thưởng người chơi | Yêu cầu riêng | M4–M6; vượt mô hình hop theo license đã đọc. |
| F32 | Thi đấu kỹ năng có phí/mua lượt | Yêu cầu riêng | M4–M6; một game server-authoritative trước. |

## Chi tiết quan sát hộp thoại `balance-refill-flow=purchase`

- Click nút số dư đổi URL sang `https://playhop.com/vi?balance-refill-flow=purchase` và mở modal; đóng modal đưa về URL không có tham số đó.
- Modal có logo, số dư `0 hop`, sáu gói quan sát được: 105, 265, 535, 750, 1.350, 2.750 hop; nhãn ưu đãi và gói bán chạy.
- Có ô số lượng khác, tại phiên khảo sát hiển thị khoảng 56–100.000 hop; email nhận hóa đơn; nút thanh toán theo giá gói; nhãn XSolla và logo phương thức thanh toán.
- Trong trạng thái chưa nhập thông tin, nút trả tiền bị vô hiệu hóa. Chưa kết luận email có phải điều kiện duy nhất, có yêu cầu đăng nhập trước trả tiền hay các bước nhận diện tiếp theo.
- Giá hiển thị theo VND và có phần lẻ trong phiên khảo sát. Không sao chép giá/tỷ lệ này cho dự án; số tiền thực thu cần đúng quy tắc tiền tệ và đối tác.
- Không biết payload token, merchant account, backend, webhook, xử lý refund hoặc chống gian lận của Playhop. Các yêu cầu bảo mật trong tài liệu tài chính là thiết kế đề xuất, không phải mô tả backend của họ.

## Phạm vi kiểm tra cần bổ sung khi triển khai

Tài khoản thử hợp lệ; mobile và thiết bị yếu; nội dung thông báo; đánh giá sau đăng nhập; cloud save ở game hỗ trợ; điều kiện tắt quảng cáo/mã; thanh toán và hoàn tiền bằng sandbox của chính dự án. Không dùng tiền thật hoặc kiểm thử xâm nhập Playhop để hoàn thiện khảo sát.

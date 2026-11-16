# Kế hoạch xây nền tảng web game

Đặc tả ngày 13/11/2026 theo khảo sát Playhop và yêu cầu đã xác nhận: hai server người dùng/quản trị dùng chung database; nạp/mua, chuyển số dư, thi đấu kỹ năng thu phí/mua lượt và rút tiền thưởng; sáu thị trường mong muốn là Việt Nam, Trung Quốc, Thái Lan, Ấn Độ, Lào, Singapore.

Đây là bộ tài liệu lập kế hoạch. Chưa có ứng dụng, database production hoặc deployment. Tiền thật phải được mở theo điều kiện từng thị trường; xem rõ các hạn chế trước khi coi mô hình có thể vận hành tại cả sáu nước.

1. [Kế hoạch tổng thể, kiến trúc và lộ trình](docs/00-KE-HOACH-TONG-THE.md)
2. [Khảo sát Playhop và ma trận tính năng](docs/01-KHAO-SAT-TINH-NANG.md)
3. [Đặc tả thanh toán, sổ cái, thi đấu, chuyển/rút và kiểm thử](docs/02-THANH-TOAN-VA-SO-CAI.md)
4. [Ma trận thị trường và điều kiện mở tiền thật](docs/03-THI-TRUONG-VA-DIEU-KIEN-MO.md)
5. [Sàng lọc quốc tế và 5 thị trường ưu tiên](docs/04-SANG-LOC-QUOC-TE-VA-5-THI-TRUONG-UU-TIEN.md)

Bổ sung nghiên cứu quốc tế: ưu tiên thẩm định Đan Mạch, Thụy Điển, Great Britain, Estonia và Malta. Ba ứng viên đầu theo điều kiện thuần kỹ năng ngoài chế độ giấy phép gambling; hai ứng viên sau theo lộ trình phân loại/cấp phép. Chưa có thị trường được duyệt giao dịch thật.

Trình tự thực hiện: chốt mô hình và game thi đấu đầu tiên → nền tảng hai server → cổng game → tài chính sandbox → giải đấu có kết quả kiểm chứng → chuyển/rút sandbox → nghiệm thu và mở giới hạn ở nơi đủ điều kiện.

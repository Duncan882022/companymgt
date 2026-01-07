Tạo cho tôi 1 hệ thống bằng react với những tính năng sau đây.
- listing tất cả các công ty trong danh sách ở comownership.json với tác thuộc tính name với linkable.
- khi người dùng click vào tên của 1 công ty, hệ thống show:
+ Tab 1 - danh sách các công ty con của công ty đã chọn với cột Name - Loại Sở Hữu (Mặc định là Trực Tiếp). 
+ Tab 2 - danh sách các cổ đông của công ty đó link từ file shareholders.json thông qua CompanyName với các cột (PersonaOrg, Ownership, From, To, Active (if to date is > To InActive, else Active)).
Áp dụng công thức bên dưới để tính công ty con gián tiếp:
A = Tỷ lệ sở hữu của  công ty 1 đến công ty N = Tỷ lệ sở hữu của Cty 1 ở Cty 2 * Tỷ lệ sở hữu của Cty 2 ở Cty 3... * Tỷ lệ sở hữu của (N-1) ở N.
X% là số cấu hình trong hệ thống, là mốc quy định quan hệ sở hữu gián tiếp.
Nếu A >= X => Công ty N là công ty con gián tiếp của Công ty 1.
Nếu A < X => Công ty N không phải công ty con gián tiếp của công ty 1.
 
Ví dụ:
Công ty 1 sở hữu 50% công ty 2, Công ty 2 sở hữu 50% công ty 3.
=> Cty 1 - Cty 3 tính tỷ lệ sở hữu gián tiếp (0.5 * 0.5) = 25% > X = 10% => Công ty 3 là công ty con gián tiếp của Công ty 1. 
+ Tab 3 - Danh sách các công ty con gián tiếp: Được tính theo công thức bên trên.
Áp dụng cả điều kiện nếu shareholder inactive, hệ thống tự động phân bổ lại % theo volume của các cổ đông.

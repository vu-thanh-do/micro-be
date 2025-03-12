// Yêu cầu tuyển dụng từ cán bộ công ty
const yeuCauMoi = {
  nam: 2025,
  thang: 3,
  phongBan: "Sản xuất",
  nguoiYeuCau: ObjectId("607f1f77bcf86cd799439020"),
  yeuCauTheoDayChuyen: [
    {
      dayChuyenId: ObjectId("607f1f77bcf86cd799439011"),  // Dây chuyền A
      hangMuc: [
        {
          hangMucId: "1",  // Daily production volume
          soLuong: 5,
          viTri: [1, 1, 1, 0, 0, 1, 1]  // Các ngày cần tuyển trong tuần
        },
        {
          hangMucId: "2",  // Standard pressure
          soLuong: 3,
          viTri: [1, 1, 0, 0, 1, 0, 0]
        }
      ]
    },
    {
      dayChuyenId: ObjectId("607f1f77bcf86cd799439012"),  // Dây chuyền B
      hangMuc: [
        {
          hangMucId: "3",  // Art employee
          soLuong: 2,
          viTri: [1, 0, 0, 1, 0, 0, 0]
        }
      ]
    }
  ],
  tongSoLuongTuyen: 10, // Tổng số lượng = 5 + 3 + 2
  yeuCauChung: {
    trinhDo: "THPT",
    doTuoi: "18-35",
    gioiTinh: "Nam/Nữ"
  },
  trangThai: "Đã đăng ký",
  ngayTao: new Date(),
  ghiChu: "Cần tuyển gấp cho đơn hàng mới"
}
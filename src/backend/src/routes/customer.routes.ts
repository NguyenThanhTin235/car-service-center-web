import { Router } from 'express';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, restoreCustomer, hardDeleteCustomer } from '../controllers/customer.controller';

const router = Router();

// Lấy danh sách khách hàng (kèm tìm kiếm)
router.get('/', getCustomers);

// Thêm mới khách hàng
router.post('/', createCustomer);

// Cập nhật thông tin khách hàng
router.put('/:id', updateCustomer);

// Xóa mềm khách hàng (UC-25)
router.delete('/:id', deleteCustomer);

// Khôi phục khách hàng đã xóa
router.patch('/:id/restore', restoreCustomer);

// Xóa vĩnh viễn khách hàng
router.delete('/:id/hard', hardDeleteCustomer);

export default router;

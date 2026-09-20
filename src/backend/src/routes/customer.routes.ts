import { Router } from 'express';
import { getCustomers, createCustomer, updateCustomer } from '../controllers/customer.controller';

const router = Router();

// Lấy danh sách khách hàng (kèm tìm kiếm)
router.get('/', getCustomers);

// Thêm mới khách hàng
router.post('/', createCustomer);

// Cập nhật thông tin khách hàng
router.put('/:id', updateCustomer);

export default router;

import { Router } from 'express';
import ContactController from '../controller/ContactController'
const router = Router();

router.post('/identify', ContactController.createOrUpdateContact);

export default router;

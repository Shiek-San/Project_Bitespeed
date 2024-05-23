import { Router } from 'express';
import ContactController from '../controller/ContactController'
import { body } from 'express-validator';
const router = Router();

router.post('/identify',
body('email').notEmpty().withMessage("Email cannot be blank").isEmail().withMessage('Not a valid e-mail address'),
body('phoneNumber').notEmpty().withMessage("Mobile Number cannot be blank"),
ContactController.createOrUpdateContact);

export default router;

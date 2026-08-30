import express from 'express'
import {
  listCampuses,
  getCampus,
  createCampus,
  updateCampus,
  deleteCampus,
} from '../controllers/campusController.js'
import { protect, restrictTo } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/', listCampuses)
router.get('/:id', getCampus)
router.post('/', restrictTo('superadmin'), createCampus)
router.put('/:id', restrictTo('superadmin'), updateCampus)
router.delete('/:id', restrictTo('superadmin'), deleteCampus)

export default router

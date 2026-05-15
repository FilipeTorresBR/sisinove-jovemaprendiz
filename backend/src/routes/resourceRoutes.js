import { Router } from "express";
import { upload } from "../middleware/multer.js";
import { authMiddleware, checkRole } from "../middleware/auth.js";
import {
  listResource,
  createResource,
  updateResource,
  deleteResource,
  getResourceMeta,
  listResourcesMetadata,
  getResourceReport,
} from "../controllers/resourceController.js";

const router = Router();

// --- Rotas de Metadados ---
// Retorna a configuração de todos os módulos (usado para montar menus)
router.get("/meta/all", listResourcesMetadata);

// Retorna a configuração específica de um módulo (campos, labels, etc)
router.get("/meta/:resource", getResourceMeta);

// --- Rotas de Dados ---
// Gera os dados para os gráficos do painel lateral
router.get("/report/:resource", getResourceReport);

// Lista os registros de um recurso (ex: GET /api/resources/aprendizes)
router.get("/:resource", authMiddleware, listResource);

// Cria um novo registro (Suporta upload de arquivo no campo 'attachments' ou 'attachments')
// Se o seu campo no resources.js se chama 'attachments', mude .single("attachments") para .single("attachments")
router.post("/:resource", authMiddleware, checkRole(['admin', 'empresas']), upload.single("attachments"), createResource);
// Atualiza um registro existente
router.put("/:resource/:id", upload.single("attachments"), updateResource);

// Remove um registro
router.delete("/:resource/:id", authMiddleware, checkRole(['admin']), deleteResource);
export default router;

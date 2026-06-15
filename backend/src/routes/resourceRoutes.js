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
  getOneResource,
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

router.get("/:resource/:id", authMiddleware, getOneResource);
// Lista os registros de um recurso (ex: GET /api/resources/aprendizes)
router.get("/:resource", authMiddleware, listResource);

// Cria um novo registro (Suporta upload de arquivo no campo 'attachments' ou 'attachments')
// Se o seu campo no resources.js se chama 'attachments', mude .single("attachments") para .single("attachments")
router.post(
  "/:resource",
  authMiddleware,
  checkRole(["admin", "empresas"]),
  // Troque upload.single por upload.fields listando os campos possíveis
  upload.fields([
    { name: "attachments", maxCount: 1 },
    { name: "boleto_attachments", maxCount: 1 },
    { name: "nota_fiscal_attachments", maxCount: 1 }
  ]),
  createResource,
);

// Lembre-se de fazer o mesmo na rota de PUT (edição), se houver:
router.put(
  "/:resource/:id",
  authMiddleware,
  checkRole(["admin", "empresas"]),
  upload.fields([
    { name: "attachments", maxCount: 1 },
    { name: "boleto_attachments", maxCount: 1 },
    { name: "nota_fiscal_attachments", maxCount: 1 }
  ]),
  updateResource, // ou o nome da sua função de atualizar
);
// Remove um registro
router.delete(
  "/:resource/:id",
  authMiddleware,
  checkRole(["admin"]),
  deleteResource,
);
export default router;

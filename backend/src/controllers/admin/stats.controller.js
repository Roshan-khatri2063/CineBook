import { asyncHandler } from "../../utils/asyncHandler.js";
import { getOverview } from "../../services/admin/stats.service.js";

export const overview = asyncHandler(async (req, res) => {
  const stats = await getOverview();
  res.json({ success: true, data: { stats } });
});

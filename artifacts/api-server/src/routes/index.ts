import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentsRouter from "./students";
import modelsRouter from "./models";
import predictionsRouter from "./predictions";
import eligibilityRouter from "./eligibility";
import careerSuggestionsRouter from "./careerSuggestions";
import percentageGroupsRouter from "./percentageGroups";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studentsRouter);
router.use(modelsRouter);
router.use(predictionsRouter);
router.use(eligibilityRouter);
router.use(careerSuggestionsRouter);
router.use(percentageGroupsRouter);
router.use(dashboardRouter);

export default router;

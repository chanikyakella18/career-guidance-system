import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import studentsRouter from "./students";
import predictionsRouter from "./predictions";
import eligibilityRouter from "./eligibility";
import careerSuggestionsRouter from "./careerSuggestions";
import percentageGroupsRouter from "./percentageGroups";
import dashboardRouter from "./dashboard";
import resumeAnalysisRouter from "./resumeAnalysis";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(studentsRouter);
router.use(predictionsRouter);
router.use(eligibilityRouter);
router.use(careerSuggestionsRouter);
router.use(percentageGroupsRouter);
router.use(dashboardRouter);
router.use(resumeAnalysisRouter);

export default router;

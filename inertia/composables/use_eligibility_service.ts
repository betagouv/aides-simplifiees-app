import sourceRules from "#publicodes/entreprise-innovation";
import Engine from "publicodes";
import { useSurveysStore } from "~/stores/surveys";
import type { SimulationResultsAides } from "~/types/aides";

export interface DispositifDetail {
  id: string;
  title: string;
  description: string;
}

export interface DispositifEligibilityInfo {
  id: string;
  title: string;
  description: string;
  value: boolean | null | any;
  status: "eligible" | "ineligible" | "potential" | "error";
  reason?: string;
  missingInfo?: string[];
}

export interface EligibilityResults {
  eligibleDispositifs: DispositifEligibilityInfo[];
  potentialDispositifs: DispositifEligibilityInfo[];
  ineligibleDispositifs: DispositifEligibilityInfo[];
  aidesResults: SimulationResultsAides;
}

// Utility: convert kebab-case or snake_case to camelCase
function toCamelCase(str: string): string {
  return str.replace(/[-_](\w)/g, (_, c) => (c ? c.toUpperCase() : ""));
}

// Utility: convert camelCase to kebab-case
function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

// Utility: convert date from YYYY-MM-DD to DD/MM/YYYY
function convertDateToFrenchFormat(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return dateStr;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Automatic mapping: map survey answers to publicodes variables by casting ids
function autoMapAnswersToPublicodesVariables(
  answers: Record<string, any>,
): Record<string, any> {
  const mapped: Record<string, any> = {};
  for (const [key, value] of Object.entries(answers)) {
    mapped[toCamelCase(key)] = value;
  }
  return mapped;
}

export function useEligibilityService() {
  // Export engine
  const engine = new Engine(sourceRules, {
    flag: {
      automaticNamespaceDisabling: false,
    },
  });

  function calculateEligibility(
    surveyId: string,
    answers: Record<string, any>,
    dispositifsToEvaluate: DispositifDetail[],
  ): EligibilityResults {
    const surveysStore = useSurveysStore();

    const mappedAnswers = autoMapAnswersToPublicodesVariables(answers);

    // 1. Filter out keys that don't exist in the publicodes model
    const validMappedAnswers: Record<string, any> = {};
    const missingKeys: string[] = [];

    Object.keys(mappedAnswers).forEach((key) => {
      try {
        // Use type assertion to handle dynamic rule names
        engine.getRule(key as any);
        validMappedAnswers[key] = mappedAnswers[key];
      } catch (e) {
        // eslint-disable-next-line unused-imports/no-unused-vars
        missingKeys.push(key);
      }
    });

    if (missingKeys.length > 0) {
      console.log("Missing keys in publicodes model:", missingKeys);
    }

    // 2. Transform values to publicodes format
    const transformedAnswers: Record<string, any> = {};

    Object.entries(validMappedAnswers).forEach(([key, value]) => {
      const question = surveysStore.findQuestionById(
        surveyId,
        toKebabCase(key),
      );

      if (question?.type === "checkbox" && Array.isArray(value)) {
        // For checkbox questions, create a new entry for each possible choice
        question.choices?.forEach((choice) => {
          const publicodesKey = `${key} . ${toCamelCase(choice.id)}`;
          transformedAnswers[publicodesKey] = value.includes(choice.id)
            ? "oui"
            : "non";
        });
      } else {
        // For non-checkbox questions, transform the value based on its type
        let transformedValue = value;
        if (value === true) {
          transformedValue = "oui";
        } else if (value === false) {
          transformedValue = "non";
        } else if (typeof value === "string") {
          // Convert date format if the question type is date
          if (question?.type === "date") {
            transformedValue = convertDateToFrenchFormat(value);
          } else {
            // Wrap string values with quotes: value -> "'value'"
            transformedValue = `"${value}"`;
          }
        }
        transformedAnswers[key] = transformedValue;
      }
    });

    engine.setSituation(transformedAnswers);

    const results: EligibilityResults = {
      eligibleDispositifs: [],
      potentialDispositifs: [],
      ineligibleDispositifs: [],
      aidesResults: {},
    };


    for (const dispositif of dispositifsToEvaluate) {
      try {
        const evaluation = engine.evaluate(`${dispositif.id} . eligibilite`);
        const value = evaluation.nodeValue;
        const baseResult = {
          id: dispositif.id,
          title: dispositif.title || dispositif.id,
          description: dispositif.description,
          explanation: null,
          value,
        };

        // Add to aidesResults
        results.aidesResults[`${dispositif.id}-eligibilite`] = value;

        // Try to evaluate montant if it exists
        try {
          const montantEvaluation = engine.evaluate(
            `${dispositif.id} . montant`,
          );
          results.aidesResults[dispositif.id] = montantEvaluation.nodeValue;
        } catch (e) {
          // eslint-disable-next-line unused-imports/no-unused-vars
          // If montant doesn't exist, set it to 0
          results.aidesResults[dispositif.id] = 0;
        }
        if (value === true) {
          results.eligibleDispositifs.push({
            ...baseResult,
            status: "eligible",
          });
        } else if (value === false) {
          let reason = "Les conditions d'éligibilité ne sont pas remplies.";
          try {
            const reasonEval = engine
              .evaluate(`${dispositif.id} . eligibilite . explications`)
              .nodeValue?.replaceAll(/Non applicable/g, "");
            console.log(
              "reasonEval",
              engine.evaluate(`${dispositif.id} . eligibilite . explications`),
              engine.evaluate(`${dispositif.id} . eligibilite`),
            );

            if (reasonEval) {
              reason = reasonEval;
            }
          } catch (e) {
            // eslint-disable-next-line unused-imports/no-unused-vars
            /* ignore */
          }
          results.ineligibleDispositifs.push({
            ...baseResult,
            status: "ineligible",
            reason,
          });
        } else {
          let reason =
            "Des informations supplémentaires sont nécessaires pour déterminer l'éligibilité.";
          const missingVars = Object.keys(evaluation.missingVariables || {});
          if (missingVars.length > 0) {
            reason = `Informations manquantes : ${missingVars.join(", ")}.`;
          }
          results.potentialDispositifs.push({
            ...baseResult,
            status: "potential",
            reason,
            missingInfo: missingVars,
          });
        }
      } catch (error) {
        results.potentialDispositifs.push({
          id: dispositif.id,
          title: dispositif.title || dispositif.id,
          description: dispositif.description,
          value: null,
          status: "error",
          reason: `Erreur lors de l'évaluation de la règle : ${(error as Error).message}`,
        });
      }
    }

    console.log(engine.evaluate(`cir . eligibilite`))
    console.log("dispositifs évalués", results);
    return results;
  }

  return {
    calculateEligibility,
    engine,
  };
}

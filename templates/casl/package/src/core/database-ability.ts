import { type SQL, or } from "drizzle-orm";

export class DatabaseAbilityBuilder<TActions extends string, TSubjects extends string> {
  private rules: { action: TActions; subject: TSubjects; rule: SQL<unknown> | undefined }[] = [];

  can(action: TActions | TActions[], subject: TSubjects, rule?: SQL<unknown>) {
    if (Array.isArray(action)) {
      this.rules.push(...action.map(a => ({ action: a, subject, rule })));
    } else {
      this.rules.push({ action, subject, rule });
    }
  }

  build() {
    return new DatabaseAbility<TActions, TSubjects>(this.rules);
  }
}

class DatabaseAbility<TActions extends string, TSubjects extends string> {
  rules: { action: TActions; subject: TSubjects; rule: SQL<unknown> | undefined }[];

  constructor(rules: { action: TActions; subject: TSubjects; rule: SQL<unknown> | undefined }[]) {
    this.rules = rules;
  }

  getQueryFor(action: TActions, subject: TSubjects): SQL<unknown> | undefined {
    const relevantRules = this.rules.filter((r) => r.action === action && r.subject === subject);

    if (relevantRules.length > 1) {
      return or(...relevantRules.map((r) => r.rule));
    }
    const [firstRule] = relevantRules;
    if (!firstRule) {
      throw new Error(`No rules found for action "${action}" and subject "${subject}"`);
    }
    return firstRule.rule;
  }
}

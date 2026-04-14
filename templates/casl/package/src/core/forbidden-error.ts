import type { AnyAbility } from "@casl/ability";
import { err, ok, type Result } from "neverthrow";
export class ForbiddenError<T extends AnyAbility> {
  private ability: T;
  private constructor(ability: T) {
    this.ability = ability;
  }

  public static from<U extends AnyAbility>(ability: U): ForbiddenError<U> {
    return new ForbiddenError(ability);
  }

  public throwUnlessCan(...args: Parameters<T["can"]>): void {
    if (!this.ability.can(...args)) {
      throw new Error("Forbidden"); //TODO: use a proper error class depending on the framework
    }
  }
}

export class ForbiddenResult<T extends AnyAbility> {
  private ability: T;
  constructor(ability: T) {
    this.ability = ability;
  }

  public static from<U extends AnyAbility>(ability: U): ForbiddenResult<U> {
    return new ForbiddenResult(ability);
  }

  public check(...args: Parameters<T["can"]>): Result<void, { kind: "FORBIDDEN" }> {
    if (!this.ability.can(...args)) {
      return err({ kind: "FORBIDDEN" });
    }
    return ok();
  }
}

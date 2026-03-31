import type { AnyAbility } from "@casl/ability";

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

public sealed record DispositionInput(
    bool? QualityReady, string[]? Observations, string? FunctionalStatus, bool? SafetyConcern,
    bool? Repairable, decimal? ResaleValue, decimal? AsIsValue, decimal? RepairCost,
    decimal? HandlingCost, decimal? SalvageValue);
public sealed record RecoveryOption(string Route, string Label, decimal Gross, decimal Costs, decimal Net, string Reason);
public sealed record DispositionResult(string PolicyVersion, string Route, string Label, decimal? EstimatedRecovery,
    string[] Reasons, RecoveryOption[] Options, string NextAction, string Basis);
public static class Disposition {
    public static DispositionResult Evaluate(DispositionInput input) {
        var allowed = new HashSet<string> { "Visible surface damage", "Stain or discoloration", "Missing or detached part", "No visible defect" };
        if (input.QualityReady is null || input.SafetyConcern is null || input.Repairable is null
            || input.Observations is null || input.Observations.Length > 4 || input.Observations.Distinct().Count() != input.Observations.Length
            || input.Observations.Any(x => !allowed.Contains(x))
            || (input.Observations.Contains("No visible defect") && input.Observations.Length > 1)
            || input.FunctionalStatus is not ("pass" or "fail" or "unknown"))
            throw new ArgumentException("Complete the condition checklist with consistent observations.");
        const string basis = "Policy calculation from reviewer supplied facts and price estimates, not automated defect detection or a guaranteed recovery value. Inventory is not changed.";
        DispositionResult Hold(string route, string label, string why, string action) =>
            new("returns-v1", route, label, null, [why], [], action, basis);
        if (input.SafetyConcern == true)
            return Hold("quarantine", "Quarantine", "A safety concern takes priority over resale value.", "Isolate the item and send it to a qualified reviewer. Do not restock it.");
        if (input.QualityReady != true)
            return Hold("retake", "Request new photographs", "At least one image readiness check needs attention.", "Capture an upright, evenly lit close view and run the review again.");
        if (input.Observations.Length == 0 || input.FunctionalStatus == "unknown")
            return Hold("inspect", "Complete the physical check", "The condition or functional check is incomplete.", "Check the item and its included parts, then record the result before selecting a resale route.");
        decimal?[] amounts = [input.ResaleValue, input.AsIsValue, input.RepairCost, input.HandlingCost, input.SalvageValue];
        if (amounts.Any(x => x is null || x < 0 || x > 100000 || decimal.Round(x.Value, 2) != x.Value))
            throw new ArgumentException("Enter all five amounts between 0 and 100000, with at most two decimal places.");
        var options = new List<RecoveryOption>();
        decimal handling = input.HandlingCost!.Value;
        void Add(string route, string label, decimal gross, decimal extra, string reason) =>
            options.Add(new(route, label, gross, extra + handling, gross - extra - handling, reason));
        bool clean = input.Observations.Contains("No visible defect");
        if (clean && input.FunctionalStatus == "pass")
            Add("restock", "Restock", input.ResaleValue!.Value, 0, "No visible defect recorded and the functional check passed.");
        if (!input.Observations.Contains("Missing or detached part") && input.FunctionalStatus == "pass")
            Add("resell", "Resell with condition disclosure", input.AsIsValue!.Value, 0, "Functional item; use the entered resale value for its current condition.");
        if (input.Repairable == true)
            Add("refurbish", "Refurbish", input.ResaleValue!.Value, input.RepairCost!.Value, "Repair feasibility is confirmed by the reviewer; repair cost is included.");
        Add("recycle", "Salvage or recycle", input.SalvageValue!.Value, 0, "Use the entered salvage proceeds and handling cost.");
        var best = options.OrderByDescending(x => x.Net).First();
        return new("returns-v1", best.Route, best.Label, best.Net,
            [best.Reason, "Highest estimated net recovery among eligible routes. Negative values mean a net handling loss."],
            options.ToArray(), best.Route == "refurbish" ? "Create a repair task, verify the repair, then reassess before resale."
                : best.Route == "restock" ? "Approve the record, then update stock in your inventory system."
                : best.Route == "resell" ? "Disclose the recorded condition and confirm the listing price before resale."
                : "Confirm the permitted salvage or recycling process and retain the review record.", basis);
    }
}

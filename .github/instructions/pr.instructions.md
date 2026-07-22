---
applyTo: '**'
---

# pr

Pull Request Creation - Create Pull Request from feature branch to main.

## Usage

```
/pr [optional feedback]
```

## Examples

```bash
/pr                           # Create PR without additional feedback
/pr Ready for review          # Create PR with feedback message
/pr Implements user auth flow # Create PR with description
```

## Implementation

### Pre-PR Validation

1. **Check Dependencies**:
   - Validate GitHub CLI (`gh`) availability
   - Verify Git tools are available

2. **Validate Environment**:
   - Ensure clean git working directory
   - Verify we're on a feature branch
   - Check branch follows naming: `feature/{description}` or `feature/task-{issue}-{description}`
   - Confirm branch is pushed to remote
   - Verify main branch exists

3. **Extract Issue Information**:
   - Parse issue number from branch name when the branch uses `feature/task-{issue}-{description}`
   - Validate issue exists and is a task when an issue number is present
   - Get issue title and description when available

### Pre-PR Validations (100% Required)

```bash
npm run build                  # Build validation
npm run lint                   # Lint validation
npm test                       # Test validation (if applicable)
```

### PR Creation

1. **Generate PR Title**:
   ```
   feat: {clean task title} (resolve #{issue-number})
   ```

2. **Create PR Body** with sections:
   - **Summary**: Task description and resolution
   - **Changes**: Implementation checklist
   - **Validation**: All validation results
   - **Test Plan**: Testing checklist
   - **Additional Notes**: User feedback (if provided)

3. **Create Pull Request**:
   ```bash
   gh pr create \
     --title "{title}" \
     --base main \
     --head "{feature-branch}" \
     --body "{body}" \
     --label "auto-pr"
   ```

## PR Body Template

```markdown
## Summary

This PR implements: **{task description}**

- Resolves #{issue-number}: {task title, when applicable}
- Created from feature branch: `{branch-name}`

## Changes

- [ ] Implementation completed according to task requirements
- [ ] Code follows project standards and conventions
- [ ] Tests added where applicable
- [ ] Documentation updated if needed

## Validation

- ✅ Build validation: 100% PASS (`npm run build`)
- ✅ Lint validation: 100% PASS (`npm run lint`)
- ✅ Tests: PASS where applicable

## Test Plan

- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] Integration with existing systems verified
- [ ] Performance impact assessed (if applicable)

## Additional Notes

{user feedback}

---

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Error Handling

- **Not on feature branch**: Clear error with current branch
- **Branch not pushed**: Instructions to push branch first
- **Validation failures**: Stop and report specific failures
- **Issue not found**: Validate issue exists before PR creation
- **Main branch missing**: Error with available branches

## Integration

- **Before**: Use `/impl [issue-number]` to complete implementation
- **After**: Wait for team review and approval
- **Target**: Always creates PR to `main`
- **Context**: PR resolves a specific GitHub issue when one exists; issue-less operational PRs are allowed when explicitly requested by the operator

## Branch Naming Requirements

Feature branches should follow one of these patterns:
```
feature/{short-description}
feature/task-{issue-number}-{description}
```

Examples:
- `feature/app-store-policy-pages`
- `feature/task-123-user-authentication`
- `feature/task-456-payment-webhook`
- `feature/task-789-database-migration`

## Important Notes

- **ALWAYS** creates PR to `main`
- **NEVER** merge PRs yourself - wait for team approval
- **100% validation** required before PR creation
- Feature branch must be pushed to remote
- Working directory must be clean
- PR should resolve a specific task issue when applicable; operator-approved issue-less PRs are allowed

## Files

- Feature branches following naming convention
- GitHub Pull Requests - Code review and discussion
- GitHub Issues - Task definitions and requirements

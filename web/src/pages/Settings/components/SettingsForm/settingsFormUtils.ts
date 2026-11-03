import type { FetcherWithComponents } from 'react-router';
import type { UpdateSettings } from '@services/settingsService/settingsService.type';
import type { ApiErrorIssue } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import { INVALID_EMAIL_MESSAGE } from '@utils/emailUtils';
import { SAVE_FAILED_MESSAGE } from '../../settingsUtils';

// The API's code for a body that failed its checks; its issues say which fields, by path.
const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR';

type SettingsField = keyof UpdateSettings;

export type SettingsFieldErrors = Partial<Record<SettingsField, string>>;

export type SaveFailure = { fieldErrors: SettingsFieldErrors; formError?: string };

// Each field the API can refuse, by its issue's path. The address gets the app's own wording, which says what a valid
// one looks like; a template gets the API's, which names the unknown placeholder.
const FIELD_BY_ISSUE_PATH: Record<string, SettingsField> = {
  '/to': 'to',
  '/subjectTemplate': 'subjectTemplate',
  '/bodyTemplate': 'bodyTemplate',
};

const FIELD_MESSAGE_MAP: Record<SettingsField, (issue: ApiErrorIssue) => string> = {
  to: () => INVALID_EMAIL_MESSAGE,
  subjectTemplate: (issue) => issue.message,
  bodyTemplate: (issue) => issue.message,
};

const NO_FAILURE: SaveFailure = { fieldErrors: {} };

function toFieldErrors(issues: ApiErrorIssue[]): SettingsFieldErrors {
  const fieldErrors: SettingsFieldErrors = {};

  for (const issue of issues) {
    const field = FIELD_BY_ISSUE_PATH[issue.path];

    if (field) fieldErrors[field] ??= FIELD_MESSAGE_MAP[field](issue);
  }

  return fieldErrors;
}

// The failed save's messages, split by where they belong: under each field the server refused, in an alert next to
// the form for anything else.
export function toSaveFailure(fetcher: FetcherWithComponents<JSONResponseUtil | undefined>): SaveFailure {
  const isIdle = fetcher.state === 'idle';
  const hasFailed = fetcher.data?.success === false;

  if (!isIdle || !hasFailed) return NO_FAILURE;

  const error = fetcher.data?.error;
  const isRefusedField = error?.code === VALIDATION_ERROR_CODE;
  const fieldErrors = isRefusedField ? toFieldErrors(error.issues ?? []) : {};
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  if (hasFieldErrors) return { fieldErrors };

  return { fieldErrors, formError: error?.message ?? SAVE_FAILED_MESSAGE };
}

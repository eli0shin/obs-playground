{{- define "obs-playground.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "obs-playground.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := include "obs-playground.name" . }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "obs-playground.componentName" -}}
{{- if eq . "nextjsCustom" }}nextjs-custom{{ else }}{{ . }}{{ end }}
{{- end }}

{{- define "obs-playground.workloadName" -}}
{{- $component := include "obs-playground.componentName" .component }}
{{- $prefixLength := sub 62 (len $component) }}
{{- $prefix := include "obs-playground.fullname" .root | trunc (int $prefixLength) | trimSuffix "-" }}
{{- printf "%s-%s" $prefix $component }}
{{- end }}

{{- define "obs-playground.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ include "obs-playground.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "obs-playground.selectorLabels" -}}
app.kubernetes.io/name: {{ include "obs-playground.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ include "obs-playground.componentName" .component }}
{{- end }}

{{- define "obs-playground.expressClaimName" -}}
{{- if .Values.persistence.existingClaim }}
{{- .Values.persistence.existingClaim }}
{{- else }}
{{- $suffix := "express-data" }}
{{- $prefixLength := sub 62 (len $suffix) }}
{{- $prefix := include "obs-playground.fullname" . | trunc (int $prefixLength) | trimSuffix "-" }}
{{- printf "%s-%s" $prefix $suffix }}
{{- end }}
{{- end }}

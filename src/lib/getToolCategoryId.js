function getToolCategoryId(provider) {
    if (!provider || typeof provider !== 'string') {
        return 'other';
    }
    if (provider.includes('prometheus')) return 'prometheus';
    if (provider.includes('k8s')) return 'kubernetes';
    if (provider.includes('istio')) return 'istio';
    if (provider.includes('docs')) return 'documentation';
    if (provider.includes('helm')) return 'helm';
    if (provider.includes('argo')) return 'argo';
    if (provider.includes('grafana')) return 'grafana';
    return 'other';
}

module.exports = getToolCategoryId; 
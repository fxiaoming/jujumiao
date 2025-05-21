package conf

import "github.com/google/wire"

// ProviderSet is conf providers.
var ProviderSet = wire.NewSet(
    ProvideMail,
)

// ProvideMail 提供 *Mail
func ProvideMail(bc *Bootstrap) *Mail {
    return bc.GetMail()
}
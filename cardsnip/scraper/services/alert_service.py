import os
from urllib.error import URLError
from urllib.request import Request, urlopen
import json

from models.product_check import ProductCheck


class AlertService:
    def send_alerts(self, check: ProductCheck) -> None:
        messages = self._build_messages(check)
        if not messages:
            print("Aucune alerte: prix au-dessus de la cible ou produit indisponible.")
            return

        for message in messages:
            print(f"[ALERTE] {message}")

        webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
        if webhook_url:
            self._send_discord_alert(webhook_url, "\n".join(messages))
        else:
            print("Discord webhook non configure, alerte console uniquement.")

    @staticmethod
    def _build_messages(check: ProductCheck) -> list[str]:
        messages = []

        if check.in_stock and check.is_good_deal:
            messages.append(
                f"Bon deal detecte: {check.name} a {check.price:.2f} EUR "
                f"(cible {check.target_price:.2f} EUR)."
            )

        if check.in_stock:
            messages.append(f"Retour ou maintien en stock: {check.name}.")

        return messages

    @staticmethod
    def _send_discord_alert(webhook_url: str, message: str) -> None:
        payload = json.dumps({"content": message}).encode("utf-8")
        request = Request(
            webhook_url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urlopen(request, timeout=10):
                pass
            print("Alerte Discord envoyee.")
        except URLError as error:
            print(f"Webhook Discord ignore apres erreur: {error}")

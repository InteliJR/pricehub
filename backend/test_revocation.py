"""
Script de Teste Completo: Autenticação, Refresh Token e Revogação
Testa todo o fluxo de autenticação do sistema
"""

import requests
import json
import logging
import time
import sys
from datetime import datetime

# Configuração
BASE_URL = "http://localhost:3000"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin@123456"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class AuthTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        
    def log_test(self, test_name, success, message=""):
        status = "✅ PASSOU" if success else "❌ FALHOU"
        logging.info(f"{test_name:50s} {status}")
        if message:
            logging.info(f"   → {message}")
        return success
    
    def pretty_print(self, response):
        try:
            logging.info(f"Status: {response.status_code}")
            data = response.json()
            logging.info(f"Resposta: {json.dumps(data, indent=2, ensure_ascii=False)}")
            return data
        except:
            logging.info(f"Resposta: {response.text}")
            return None
    
    # ========================================
    # TESTES DE AUTENTICAÇÃO BÁSICA
    # ========================================
    
    def test_1_login(self):
        """Teste 1: Login básico"""
        logging.info("\n" + "="*60)
        logging.info("TESTE 1: Login Básico")
        logging.info("="*60)
        
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = self.session.post(f"{BASE_URL}/auth/login", json=payload)
        data = self.pretty_print(response)
        
        if response.status_code == 200 and data:
            self.access_token = data.get('accessToken')
            self.refresh_token = data.get('refreshToken')
            self.user_id = data.get('user', {}).get('id')
            
            return self.log_test(
                "Login com credenciais válidas",
                True,
                f"Tokens obtidos. User ID: {self.user_id}"
            )
        
        return self.log_test("Login com credenciais válidas", False)
    
    def test_2_access_protected_route(self):
        """Teste 2: Acessar rota protegida com access token"""
        logging.info("\n" + "="*60)
        logging.info("TESTE 2: Acesso a Rota Protegida")
        logging.info("="*60)
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
        data = self.pretty_print(response)
        
        success = response.status_code == 200 and data is not None
        return self.log_test(
            "Acesso com access token válido",
            success,
            f"Usuário autenticado: {data.get('email') if data else 'N/A'}"
        )
    
    def test_3_invalid_token(self):
        """Teste 3: Tentar acessar com token inválido"""
        logging.info("\n" + "="*60)
        logging.info("TESTE 3: Token Inválido")
        logging.info("="*60)
        
        headers = {"Authorization": "Bearer token_invalido_fake"}
        response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
        self.pretty_print(response)
        
        return self.log_test(
            "Rejeição de token inválido",
            response.status_code == 401,
            "Sistema bloqueou acesso corretamente"
        )
    
    # ========================================
    # TESTES DE REFRESH TOKEN
    # ========================================
    
    def test_4_refresh_token(self):
        """Teste 4: Renovar tokens com refresh token"""
        logging.info("\n" + "="*60)
        logging.info("TESTE 4: Refresh Token")
        logging.info("="*60)
        
        payload = {"refreshToken": self.refresh_token}
        response = self.session.post(f"{BASE_URL}/auth/refresh", json=payload)
        data = self.pretty_print(response)
        
        if response.status_code == 200 and data:
            old_access = self.access_token
            self.access_token = data.get('accessToken')
            self.refresh_token = data.get('refreshToken')
            
            return self.log_test(
                "Renovação de tokens com refresh token",
                True,
                f"Novo access token gerado (diferente: {old_access != self.access_token})"
            )
        
        return self.log_test("Renovação de tokens com refresh token", False)
    
    def test_5_invalid_refresh_token(self):
        """Teste 5: Tentar refresh com token inválido"""
        logging.info("\n" + "="*60)
        logging.info("TESTE 5: Refresh Token Inválido")
        logging.info("="*60)
        
        payload = {"refreshToken": "refresh_token_fake_invalido"}
        response = self.session.post(f"{BASE_URL}/auth/refresh", json=payload)
        self.pretty_print(response)
        
        return self.log_test(
            "Rejeição de refresh token inválido",
            response.status_code == 401,
            "Sistema bloqueou refresh inválido"
        )
    
    # ========================================
    # TESTES DE REVOGAÇÃO
    # ========================================
    
    def test_6_logout(self):
        """Teste 6: Logout e revogação de token"""
        logging.info("\n" + "="*60)
        logging.info("TESTE 6: Logout e Revogação")
        logging.info("="*60)
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {"refreshToken": self.refresh_token}
        
        response = self.session.post(
            f"{BASE_URL}/auth/logout",
            headers=headers,
            json=payload
        )
        self.pretty_print(response)
        
        return self.log_test(
            "Logout e revogação de refresh token",
            response.status_code == 200,
            "Token adicionado à blacklist"
        )
    
    def test_7_revoked_token_blocked(self):
        """Teste 7: Verificar se token revogado é bloqueado"""
        logging.info("\n" + "="*60)
        logging.info("TESTE 7: Token Revogado é Bloqueado")
        logging.info("="*60)
        
        # Aguardar propagação
        time.sleep(1)
        
        # Tentar usar refresh token revogado
        payload = {"refreshToken": self.refresh_token}
        response = self.session.post(f"{BASE_URL}/auth/refresh", json=payload)
        self.pretty_print(response)
        
        return self.log_test(
            "Bloqueio de refresh token revogado",
            response.status_code == 401,
            "Sistema detectou token na blacklist"
        )
    
    def test_8_access_after_logout(self):
        """Teste 8: Verificar se access token ainda funciona após logout"""
        logging.info("\n" + "="*60)
        logging.info("TESTE 8: Access Token Após Logout")
        logging.info("="*60)
        logging.info("⚠️  Access token NÃO é revogado no logout (apenas refresh)")
        logging.info("    Ele expira naturalmente após 15 minutos")
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
        self.pretty_print(response)
        
        # Access token ainda deve funcionar (não foi revogado, apenas refresh)
        success = response.status_code == 200
        return self.log_test(
            "Access token ainda válido após logout",
            success,
            "Comportamento esperado: access token expira naturalmente"
        )
    
    # ========================================
    # TESTE DE LOGOUT ALL
    # ========================================
    
    def test_9_logout_all_devices(self):
        """Teste 9: Logout de todos os dispositivos"""
        logging.info("\n" + "="*60)
        logging.info("TESTE 9: Logout de Todos os Dispositivos")
        logging.info("="*60)
        
        # Fazer novo login para ter tokens válidos
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        response = self.session.post(f"{BASE_URL}/auth/login", json=payload)
        data = response.json() if response.status_code == 200 else None
        
        if not data:
            return self.log_test("Logout de todos os dispositivos", False, "Falha no login")
        
        self.access_token = data.get('accessToken')
        self.refresh_token = data.get('refreshToken')
        
        # Logout all
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = self.session.post(
            f"{BASE_URL}/auth/logout-all",
            headers=headers
        )
        self.pretty_print(response)
        
        return self.log_test(
            "Logout de todos os dispositivos",
            response.status_code == 200,
            "Todos os refresh tokens do usuário foram revogados"
        )
    
    # ========================================
    # TESTE DE LIMPEZA AUTOMÁTICA
    # ========================================
    
    def test_10_cleanup_endpoint(self):
        """Teste 10: Endpoint de limpeza manual (apenas ADMIN)"""
        logging.info("\n" + "="*60)
        logging.info("TESTE 10: Limpeza Manual de Tokens Expirados")
        logging.info("="*60)
        
        # Fazer login novamente
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        response = self.session.post(f"{BASE_URL}/auth/login", json=payload)
        data = response.json() if response.status_code == 200 else None
        
        if not data:
            return self.log_test("Limpeza manual de tokens", False, "Falha no login")
        
        self.access_token = data.get('accessToken')
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = self.session.post(
            f"{BASE_URL}/admin/cleanup-tokens",
            headers=headers
        )
        data = self.pretty_print(response)
        
        success = response.status_code == 200
        message = f"Tokens removidos: {data.get('tokensRemoved', 0)}" if data else ""
        
        return self.log_test(
            "Endpoint de limpeza manual (ADMIN)",
            success,
            message
        )
    
    # ========================================
    # EXECUTAR TODOS OS TESTES
    # ========================================
    
    def run_all(self):
        """Executa toda a bateria de testes"""
        logging.info("="*60)
        logging.info("🚀 INICIANDO BATERIA COMPLETA DE TESTES DE AUTENTICAÇÃO")
        logging.info("="*60)
        
        results = {}
        
        # Testes de autenticação básica
        results['test_1_login'] = self.test_1_login()
        results['test_2_access_protected'] = self.test_2_access_protected_route()
        results['test_3_invalid_token'] = self.test_3_invalid_token()
        
        # Testes de refresh token
        results['test_4_refresh'] = self.test_4_refresh_token()
        results['test_5_invalid_refresh'] = self.test_5_invalid_refresh_token()
        
        # Testes de revogação
        results['test_6_logout'] = self.test_6_logout()
        results['test_7_revoked_blocked'] = self.test_7_revoked_token_blocked()
        results['test_8_access_after_logout'] = self.test_8_access_after_logout()
        
        # Testes avançados
        results['test_9_logout_all'] = self.test_9_logout_all_devices()
        results['test_10_cleanup'] = self.test_10_cleanup_endpoint()
        
        # Resumo
        logging.info("\n" + "="*60)
        logging.info("📊 RESUMO FINAL DOS TESTES")
        logging.info("="*60)
        
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        
        for test_name, passed_test in results.items():
            status = "✅ PASSOU" if passed_test else "❌ FALHOU"
            logging.info(f"{test_name:40s} {status}")
        
        logging.info("="*60)
        logging.info(f"Total: {passed}/{total} testes passaram")
        logging.info(f"Taxa de sucesso: {(passed/total)*100:.1f}%")
        logging.info("="*60)
        
        if passed == total:
            logging.info("🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente!")
            return 0
        else:
            logging.error(f"⚠️  {total - passed} teste(s) falharam. Verifique os logs acima.")
            return 1

if __name__ == "__main__":
    tester = AuthTester()
    exit_code = tester.run_all()
    sys.exit(exit_code)
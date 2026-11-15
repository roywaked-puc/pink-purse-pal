import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { passwordSchema, getPasswordStrength } from '@/lib/passwordValidation';
import { Progress } from '@/components/ui/progress';
import { LogoBelafy } from '@/components/ds/LogoBelafy';

const emailSchema = z.string().email('Email inválido').max(255, 'Email muito longo');

const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erro de validação',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      let message = 'Erro ao fazer login';
      if (error.message.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Por favor, confirme seu email antes de fazer login';
      }
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bem-vinda!',
        description: 'Login realizado com sucesso',
      });
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      let message = 'Erro ao criar conta';
      if (error.message.includes('User already registered')) {
        message = 'Este email já está cadastrado. Tente fazer login.';
      } else if (error.message.includes('Password should be at least')) {
        message = 'A senha não atende aos requisitos de segurança';
      }
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Conta criada!',
        description: 'Sua conta foi criada com sucesso. Você já pode usar o app!',
      });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-belafy-ameixa">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <LogoBelafy variante="escuro" tamanho={48} />
        <p className="text-white font-medium text-2xl leading-snug max-w-xs">
          Agenda, clientes e caixa do seu atendimento em um só lugar.
        </p>
      </div>

      <div className="w-full md:flex md:justify-center md:px-4 md:pb-10">
        <Card className="w-full md:max-w-md border-0 rounded-t-3xl rounded-b-none md:rounded-3xl shadow-elevated">
          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="login"
                  className="relative data-[state=active]:text-belafy-ameixa data-[state=active]:after:absolute data-[state=active]:after:bottom-1 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:h-0.5 data-[state=active]:after:w-8 data-[state=active]:after:rounded-full data-[state=active]:after:bg-belafy-ameixa"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="relative data-[state=active]:text-belafy-ameixa data-[state=active]:after:absolute data-[state=active]:after:bottom-1 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:h-0.5 data-[state=active]:after:w-8 data-[state=active]:after:rounded-full data-[state=active]:after:bg-belafy-ameixa"
                >
                  Criar Conta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="focus-visible:ring-belafy-ameixa"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Senha</Label>
                      <button
                        type="button"
                        onClick={() => navigate('/recuperar-senha')}
                        className="text-xs text-belafy-ameixa hover:opacity-80 underline transition-opacity"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="pr-10 focus-visible:ring-belafy-ameixa"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full min-h-12 bg-belafy-ameixa text-white hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="focus-visible:ring-belafy-ameixa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="focus-visible:ring-belafy-ameixa"
                    />
                    {password && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(getPasswordStrength(password).score / 5) * 100}
                            className={`h-2 flex-1`}
                          />
                          <span className={`text-xs font-medium ${
                            getPasswordStrength(password).score <= 2 ? 'text-destructive' :
                            getPasswordStrength(password).score <= 3 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {getPasswordStrength(password).label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Use 8+ caracteres, maiúscula, número e símbolo
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full min-h-12 bg-belafy-ameixa text-white hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                  <p className="text-xs leading-relaxed text-muted-foreground text-center">
                    Ao criar a conta, você concorda com os{' '}
                    <Link to="/termos" className="text-belafy-ameixa underline underline-offset-2">Termos de Uso</Link>{' '}
                    e a{' '}
                    <Link to="/privacidade" className="text-belafy-ameixa underline underline-offset-2">Política de Privacidade</Link>.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;

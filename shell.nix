{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  packages = [
    pkgs.nodejs_24
    pkgs.nodePackages.pnpm
  ];

  shellHook = ''
    echo "Node $(node -v) ready."
  '';
}

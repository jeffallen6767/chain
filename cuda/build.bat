cl.exe main.cpp /Feminer ^
  /I "%CUDA_PATH%\include" ^
  "%CUDA_PATH%"\lib\x64\nvrtc.lib "%CUDA_PATH%"\lib\x64\cuda.lib "%CUDA_PATH%"\lib\x64\cudart.lib